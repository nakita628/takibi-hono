import type { ComponentAdapter, Components, Operation, ParamIn, Schema, SchemaLib } from 'oas-truth'
import {
  makeSchemaIdentifiers,
  makeSchemaReplacements,
  schemaRefToName,
  toIdentifierPascalCase,
  valueToCode,
} from 'oas-truth'

import { freeName } from '../helper/identifiers.js'
import type { ImportEntry } from '../helper/imports.js'
import { withImports } from '../helper/imports.js'
import { getLibrary, makeInlineAdapter, makeLibraryImports } from '../helper/library.js'
import type { Route } from '../helper/operations.js'
import { resolveRef } from '../helper/operations.js'

type HandlerContext = {
  readonly lib: SchemaLib
  /** hono-openapi (`describeRoute` + `validator`) instead of the plain Hono validator middleware. */
  readonly openapi: boolean
  readonly components: Components | undefined
  /** `#/components/responses/*` become `<X>Response` identifiers (the responses module is generated). */
  readonly responseRefs: boolean
  /** Component identifiers the handler may reference, with their module specifier. */
  readonly imports: readonly ImportEntry[]
}

/** The Operation Object fields `describeRoute` documents; parameters and bodies come from the validators. */
const DESCRIBE_ROUTE_KEYS: ReadonlySet<string> = new Set([
  'tags',
  'summary',
  'description',
  'externalDocs',
  'operationId',
  'responses',
  'deprecated',
  'security',
  'servers',
])

const PARAMETER_LOCATIONS = ['path', 'query', 'header', 'cookie'] as const

/** Hono's chain covers these; `head` / `trace` go through `.on('METHOD', ...)`. */
const CHAIN_METHODS: ReadonlySet<string> = new Set([
  'get',
  'post',
  'put',
  'delete',
  'options',
  'patch',
])

function makeRouteCall(method: string, args: readonly string[]) {
  if (CHAIN_METHODS.has(method)) return `.${method}(${args.join(',')})`
  return `.on(${[`'${method.toUpperCase()}'`, ...args].join(',')})`
}

function bodyTarget(mediaType: string) {
  if (mediaType === 'application/x-www-form-urlencoded' || mediaType === 'multipart/form-data') {
    return 'form'
  }
  return /^application\/(?:[\w.-]+\+)?json$/u.test(mediaType) ? 'json' : undefined
}

/**
 * Response content schemas are the only slots hono-openapi resolves, so only they
 * are wrapped in `resolver(...)`; header schemas stay plain JSON Schema.
 */
function makeDescribeRoute(
  operation: Operation,
  adapter: ComponentAdapter,
  options: {
    readonly responseRefs: boolean
    readonly identifiers: ReadonlyMap<string, string>
  },
) {
  const doc = Object.fromEntries(
    Object.entries(operation)
      // A TypeSpec document compiles to an Operation that carries `summary: undefined`;
      // `describeRoute` types the field as `string`, so an undefined one is left out.
      .filter(([key, value]) => DESCRIBE_ROUTE_KEYS.has(key) && value !== undefined)
      // YAML reads an unquoted `operationId: true` (or `404`) as a boolean (or number).
      .map(([key, value]) => [
        key,
        key === 'operationId' && (typeof value === 'boolean' || typeof value === 'number')
          ? String(value)
          : value,
      ]),
  )
  const responses = Object.values(operation.responses ?? {})
  const identifiers = options.identifiers
  const contents = makeSchemaReplacements(
    responses.flatMap((response) => (response.$ref === undefined ? [response.content ?? {}] : [])),
    adapter,
    { slot: 'response-content', identifiers },
  )
  const references = responses.flatMap((response) =>
    options.responseRefs && response.$ref?.startsWith('#/components/responses/')
      ? [[response, `${toIdentifierPascalCase(schemaRefToName(response.$ref))}Response`] as const]
      : [],
  )
  return `describeRoute(${valueToCode(doc, new Map([...contents, ...references]), identifiers)})`
}

/**
 * The key Hono's validator reads a parameter under: header names are case-insensitive and Hono
 * hands them over lowercased, so `X-Rate-Limit` is read as `x-rate-limit`.
 */
function wireName(parameter: { readonly name: string; readonly in: string }) {
  return parameter.in === 'header' ? parameter.name.toLowerCase() : parameter.name
}

type TextRefContext = {
  readonly paramIn: ParamIn
  readonly adapter: ComponentAdapter
  readonly schemas: Components['schemas']
  readonly seen: ReadonlySet<string>
}

/**
 * `schema` with every `#/components/schemas/*` reference whose component reads differently
 * from text replaced by that component. A component is declared once, without `paramIn`, so
 * a parameter or form field pointing at an integer component would be validated as a number
 * it never arrives as. A component whose expression is the same either way (a string enum)
 * stays a reference, and so keeps its `$ref` in the document; a recursive one stays too.
 */
function inlineTextRefs(schema: Schema, context: TextRefContext): Schema {
  const name = schema.$ref?.startsWith('#/components/schemas/') && schemaRefToName(schema.$ref)
  const target = name ? context.schemas?.[name] : undefined
  if (name && target && !context.seen.has(name)) {
    const inlined = inlineTextRefs(target, { ...context, seen: new Set([...context.seen, name]) })
    const { adapter, paramIn } = context
    if (adapter.toExpression(inlined, paramIn) !== adapter.toExpression(inlined)) {
      const { $ref: _, ...siblings } = schema
      return { ...inlined, ...inlineChildren(siblings, context) }
    }
  }
  return inlineChildren(schema, context)
}

/** `inlineTextRefs` over every keyword of `schema` that holds a schema. */
function inlineChildren(schema: Schema, context: TextRefContext): Schema {
  const one = (child: Schema) => inlineTextRefs(child, context)
  const oneOrBoolean = (child: Schema | boolean) =>
    typeof child === 'boolean' ? child : one(child)
  const many = (children: readonly Schema[]) => children.map(one)
  const byKey = (children: { readonly [k: string]: Schema }) =>
    Object.fromEntries(Object.entries(children).map(([key, child]) => [key, one(child)]))
  const { items } = schema
  return {
    ...schema,
    ...(schema.properties && { properties: byKey(schema.properties) }),
    ...(schema.patternProperties && { patternProperties: byKey(schema.patternProperties) }),
    ...(schema.dependentSchemas && { dependentSchemas: byKey(schema.dependentSchemas) }),
    ...(schema.$defs && { $defs: byKey(schema.$defs) }),
    ...(items !== undefined && {
      items: typeof items === 'boolean' || !('length' in items) ? oneOrBoolean(items) : many(items),
    }),
    ...(schema.prefixItems && { prefixItems: many(schema.prefixItems) }),
    ...(schema.allOf && { allOf: many(schema.allOf) }),
    ...(schema.anyOf && { anyOf: many(schema.anyOf) }),
    ...(schema.oneOf && { oneOf: many(schema.oneOf) }),
    ...(schema.not && { not: one(schema.not) }),
    ...(schema.if && { if: one(schema.if) }),
    // oxlint-disable-next-line unicorn/no-thenable -- JSON Schema's `then`, not a Promise
    ...(schema.then && { then: one(schema.then) }),
    ...(schema.else && { else: one(schema.else) }),
    ...(schema.contains && { contains: one(schema.contains) }),
    ...(schema.propertyNames && { propertyNames: one(schema.propertyNames) }),
    ...(schema.additionalProperties !== undefined && {
      additionalProperties: oneOrBoolean(schema.additionalProperties),
    }),
    ...(schema.unevaluatedProperties !== undefined && {
      unevaluatedProperties: oneOrBoolean(schema.unevaluatedProperties),
    }),
    ...(schema.unevaluatedItems !== undefined && {
      unevaluatedItems: oneOrBoolean(schema.unevaluatedItems),
    }),
  }
}

/**
 * `[target, expression]` per Hono validator: one object schema per parameter
 * location (schema-truth applies the wire coercion), then one per body target
 * (`application/json` wins over other JSON types; a form body is coerced as `formData`).
 */
function makeValidators(
  route: Route,
  components: Components | undefined,
  adapter: ComponentAdapter,
) {
  const parameters = new Map(
    [...route.parameters, ...(route.operation.parameters ?? [])].flatMap((raw) => {
      const parameter = resolveRef(raw, components?.parameters)
      // An operation-level parameter overrides the Path Item's one with the same name and location.
      return parameter?.schema
        ? [[`${parameter.in}:${wireName(parameter)}`, parameter] as const]
        : []
    }),
  )
  const parameterValidators = PARAMETER_LOCATIONS.flatMap((location) => {
    const group = [...parameters.values()].filter((parameter) => parameter.in === location)
    if (group.length === 0) return []
    const schema: Schema = {
      type: 'object',
      properties: Object.fromEntries(
        group.map((parameter) => [wireName(parameter), parameter.schema ?? {}]),
      ),
      required: group
        .filter((parameter) => location === 'path' || parameter.required === true)
        .map(wireName),
    }
    // Every location arrives as text, and schema-truth coerces each one from it. A parameter's
    // `style` / `explode` / `allowEmptyValue` are not passed: they apply to the expression's
    // root, which is this synthesized object, not the parameter.
    const coerced = inlineTextRefs(schema, {
      paramIn: location,
      adapter,
      schemas: components?.schemas,
      seen: new Set(),
    })
    return [
      [location === 'path' ? 'param' : location, adapter.toExpression(coerced, location)] as const,
    ]
  })
  const body = resolveRef(route.operation.requestBody, components?.requestBodies)
  const media = Object.entries(body?.content ?? {}).flatMap(([type, value]) => {
    const target = bodyTarget(type)
    return target && 'schema' in value && value.schema
      ? [{ type, target, schema: value.schema }]
      : []
  })
  const bodyValidators = (['json', 'form'] as const).flatMap((target) => {
    const candidates = media.filter((entry) => entry.target === target)
    const chosen = candidates.find((entry) => entry.type === 'application/json') ?? candidates[0]
    // A form body's fields arrive as text (or a `File`), so they are coerced as `formData`.
    const paramIn = target === 'form' ? 'formData' : undefined
    if (!chosen) return []
    const schema = paramIn
      ? inlineTextRefs(chosen.schema, {
          paramIn,
          adapter,
          schemas: components?.schemas,
          seen: new Set(),
        })
      : chosen.schema
    return [[target, adapter.toExpression(schema, paramIn)] as const]
  })
  return [...parameterValidators, ...bodyValidators]
}

/** `/users` → `usersHandler`, `__root` → `rootHandler`. */
export function toHandlerVarName(fileName: string) {
  const [first = '', ...rest] = (fileName === '__root' ? 'root' : fileName)
    .replaceAll(/[^A-Za-z0-9]+/gu, ' ')
    .trim()
    .split(' ')
  const base = `${first.toLowerCase()}${rest.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`
  // A path segment can start with a digit (`/2010-04-01`).
  return `${/^[0-9]/u.test(base) ? '_' : ''}${base}Handler`
}

/** One `new Hono()` route chain; every handler body is a `(c)=>{}` stub for the merge to fill. */
export function makeHandlerCode(
  varName: string,
  routes: readonly Route[],
  context: HandlerContext,
) {
  const library = getLibrary(context.lib)
  const adapter = makeInlineAdapter(context.lib, {
    resolver: context.openapi,
    ...(context.openapi && { slots: ['response-content'] as const }),
  })
  const identifiers = makeSchemaIdentifiers(context.components?.schemas ?? {})
  const validator = context.openapi
    ? { name: 'validator', wrap: library.toStandardSchema }
    : { name: library.validator.entry.name, wrap: library.validator.wrap }
  const calls = routes.map((route) =>
    makeRouteCall(route.method, [
      `'${route.path}'`,
      ...(context.openapi
        ? [
            makeDescribeRoute(route.operation, adapter, {
              responseRefs: context.responseRefs,
              identifiers,
            }),
          ]
        : []),
      ...makeValidators(route, context.components, adapter).map(
        ([target, expr]) => `${validator.name}('${target}',${validator.wrap(expr)})`,
      ),
      '(c)=>{}',
    ]),
  )
  const body = `export const ${varName}=new Hono()${calls.join('')}`
  return withImports(body, [...makeLibraryImports(context.lib), ...context.imports])
}

// What a group cannot be exported as: the words of the language, strict mode's included (a
// module is strict), and the two names strict mode refuses to bind.
const RESERVED = new Set([
  'arguments',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
])

/**
 * The export of a group of a split app, which is a handler file: its name as an identifier
 * (`pets`, `userProfiles`, `_20100401`), `__root` for the root as hono-takibi names it, and
 * `__` before a word of the language (`__delete`).
 */
export function toGroupName(fileName: string) {
  if (fileName === '__root') return '__root'
  const base = toHandlerVarName(fileName).replace(/Handler$/u, '')
  return RESERVED.has(base) ? `__${base}` : base
}

/**
 * The app entry: every handler routed on one app, under the base path. `api` is the app with
 * every route. With `split`, each handler file is a group exported under its name instead, so
 * that a client of one group resolves the routes of that group and not of the whole app; the
 * routes are still registered on the one app. The app is bound as `app`, unless a group takes
 * that name.
 */
export function makeAppCode(
  handlerFileNames: readonly string[],
  options: {
    readonly basePath: string | undefined
    readonly handlersImport: string
    readonly split?: boolean | undefined
  },
) {
  const files = handlerFileNames.toSorted()
  const names = files.map(toHandlerVarName)
  const app = options.split === true ? freeName('app', files.map(toGroupName)) : 'app'
  const created = options.basePath
    ? `new Hono().basePath(${JSON.stringify(options.basePath)})`
    : 'new Hono()'
  const routes =
    options.split === true
      ? files
          .map(
            (file) =>
              `export const ${toGroupName(file)}=${app}.route('/',${toHandlerVarName(file)})`,
          )
          .join('\n\n')
      : `export const api=app${names.map((name) => `.route('/',${name})`).join('')}`
  return `import{Hono}from'hono'\nimport{${names.join(',')}}from'${options.handlersImport}'\n\nconst ${app}=${created}\n\n${routes}\n\nexport default ${app}`
}
