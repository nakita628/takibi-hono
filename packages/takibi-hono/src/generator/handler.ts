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
  /**
   * Hono's `defineHandler` (`hono/factory`): the definitions module declares one
   * `<method><Path>Handler = defineHandler({...})` per operation, and the handler file calls
   * each with its handler (`getPetsHandler(async (c, { query }) => {})`) in place of the
   * validator middleware. `names` is the definition of each route, `from` the module.
   */
  readonly defineHandler?: {
    readonly from: string
    /** The definition of each route, by {@link routeKey}. */
    readonly names: ReadonlyMap<string, string>
  }
}

/** The request targets `defineHandler` validates, in the order its options are written. */
const DEFINE_HANDLER_TARGETS = ['param', 'query', 'header', 'cookie', 'form', 'json'] as const

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

/**
 * The schema `defineHandler` validates the returned value with: the JSON content of the
 * success responses (`2XX`), as one schema when they agree and `anyOf` them when they do
 * not. An operation whose success responses carry no JSON validates no response, and its
 * handler answers whatever it returns (`null` as 204).
 */
function makeResponseSchema(
  operation: Operation,
  components: Components | undefined,
  adapter: ComponentAdapter,
) {
  const schemas = Object.entries(operation.responses ?? {})
    .filter(([status]) => /^2(?:\d\d|XX)$/u.test(status))
    .flatMap(([, raw]) => {
      const response = resolveRef(raw, components?.responses)
      return Object.entries(response?.content ?? {}).flatMap(([type, media]) =>
        bodyTarget(type) === 'json' && 'schema' in media && media.schema ? [media.schema] : [],
      )
    })
  // Two responses that spell the same schema (`200` and `201` both `Pet`) are one schema.
  const distinct = [...new Map(schemas.map((s) => [adapter.toExpression(s), s])).values()]
  const [first] = distinct
  if (first === undefined) return undefined
  return adapter.toExpression(distinct.length === 1 ? first : { anyOf: distinct })
}

/**
 * The handler of one operation, as hono-takibi names a route: the method, then the path in
 * PascalCase. `('post', '/users/:id')` → `postUsersIdHandler`, `('get', '/')` → `getHandler`,
 * and a trailing slash adds `Index`.
 */
export function toOperationVarName(method: string, path: string) {
  const index = path !== '/' && path.endsWith('/') ? 'Index' : ''
  const words = path
    .replaceAll(/[^A-Za-z0-9]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
  return `${method}${words}${index}Handler`
}

/**
 * The definition of an operation, `export const <name>=defineHandler({...})`: its validators as
 * `defineHandler` options, each a Standard Schema, and the response schema under `response`.
 * It is the function that takes the handler, which the handler file calls; an operation that
 * validates nothing is `defineHandler({})`, so that every operation is called the same way.
 */
function makeDefinitionCode(
  name: string,
  route: Route,
  context: HandlerContext,
  adapter: ComponentAdapter,
) {
  const { toDefineHandlerSchema } = getLibrary(context.lib)
  if (toDefineHandlerSchema === undefined) {
    throw new Error(
      `defineHandler takes Standard Schema validators, which ${context.lib} has none of`,
    )
  }
  const byTarget = new Map(makeValidators(route, context.components, adapter))
  const response = makeResponseSchema(route.operation, context.components, adapter)
  const options = [
    ...DEFINE_HANDLER_TARGETS.flatMap((target) => {
      const expr = byTarget.get(target)
      return expr === undefined ? [] : [`${target}:${toDefineHandlerSchema(expr)}`]
    }),
    ...(response === undefined ? [] : [`response:${toDefineHandlerSchema(response)}`]),
  ]
  return `export const ${name}=defineHandler({${options.join(',')}})`
}

/** The request targets a definition validates: what its handler takes apart. */
function validatedTargets(route: Route, context: HandlerContext, adapter: ComponentAdapter) {
  const byTarget = new Map(makeValidators(route, context.components, adapter))
  return DEFINE_HANDLER_TARGETS.filter((target) => byTarget.has(target))
}

/**
 * The definition name of every route, in order: its method and path, numbered when a name is
 * the one a handler file is exported under (`postCommentsHandler2` beside the group export of
 * `/post-comments`, which the handler file that imports the definition exports) or already
 * given to an earlier route. `handlerFileNames` are the handler files, without `.ts`; a file
 * that is numbered itself (`nameHandlers`) is numbered past these names, so that a definition
 * keeps its name when a handler file joins another of the same export.
 */
export function nameOperations(routes: readonly Route[], handlerFileNames: readonly string[]) {
  const names = new Set(handlerFileNames.map(toHandlerVarName))
  return new Map(
    routes.map((route) => {
      const name = freeName(toOperationVarName(route.method, route.path), names)
      names.add(name)
      return [routeKey(route), name] as const
    }),
  )
}

/** What a route is known by across the generators: its method and path. */
export function routeKey(route: Route) {
  return `${route.method} ${route.path}`
}

/** What a definitions module is built from: the library and the schemas it may refer to. */
export type DefinitionsContext = Omit<HandlerContext, 'defineHandler' | 'responseRefs' | 'openapi'>

/**
 * The definition of every route, by the name `names` gives it, without imports: `fileName` is
 * the file a split target writes it to (`getPets.ts` for `getPetsHandler`). Nothing in a
 * definition is the user's, so a definitions module is written over.
 */
export function makeDefinitionEntries(
  routes: readonly Route[],
  names: ReadonlyMap<string, string>,
  context: DefinitionsContext,
) {
  const full: HandlerContext = { ...context, openapi: false, responseRefs: false }
  const adapter = makeInlineAdapter(context.lib, { resolver: false })
  return routes.map((route) => {
    const name = names.get(routeKey(route)) ?? toOperationVarName(route.method, route.path)
    return {
      name,
      fileName: name.replace(/Handler(\d*)$/u, '$1'),
      code: makeDefinitionCode(name, route, full, adapter),
    }
  })
}

/** The definitions as one module, importing the schemas it refers to. */
export function makeDefinitionsCode(
  routes: readonly Route[],
  names: ReadonlyMap<string, string>,
  context: DefinitionsContext,
) {
  const body = makeDefinitionEntries(routes, names, context).map((entry) => entry.code)
  return withImports(body.join('\n\n'), [...makeLibraryImports(context.lib), ...context.imports])
}

/**
 * `users` → `usersHandler`, `real-time-events` → `realTimeEventsHandler`, `__root` →
 * `rootHandler`: what is no letter or digit is a word break, and a word keeps its case (a file
 * renamed by hand to `realTimeEvents.ts` exports `realTimeEventsHandler`), but for a leading
 * capital or acronym, which is lowercased (`APIKeys` → `apiKeysHandler`, `URLs` → `urlsHandler`).
 */
function toHandlerVarName(fileName: string) {
  const [first = '', ...rest] = (fileName === '__root' ? 'root' : fileName)
    .replaceAll(/[^A-Za-z0-9]+/gu, ' ')
    .trim()
    .split(' ')
  const head = first.replace(/^[A-Z]+(?=s?(?:[^A-Za-z]|$))|^[A-Z]+(?=[A-Z][a-z])|^[A-Z]/u, (caps) =>
    caps.toLowerCase(),
  )
  const base = `${head}${rest.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`
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
  const definitions = context.defineHandler
  if (definitions) {
    // Each route call takes the definition with the stub handler, which takes the validated
    // targets apart for the merge to fill; the definitions are imported from their module.
    const calls = routes.map((route) => {
      const name =
        definitions.names.get(routeKey(route)) ?? toOperationVarName(route.method, route.path)
      const targets = validatedTargets(route, context, adapter)
      const input = targets.length > 0 ? `,{${targets.join(',')}}` : ''
      return makeRouteCall(route.method, [`'${route.path}'`, `${name}(async(c${input})=>{})`])
    })
    const body = `export const ${varName}=new Hono()${calls.join('')}`
    const imported = routes
      .map((route) => definitions.names.get(routeKey(route)))
      .filter((n) => n !== undefined)
    return withImports(body, [
      { name: 'Hono', from: 'hono' },
      ...[...new Set(imported)].map((name) => ({ name, from: definitions.from })),
    ])
  }
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
 * (`pets`, `userProfiles`, `_20100401`), `__root` for the root as hono-takibi names it, `__`
 * before a word of the language (`__delete`), and `_` for a name with no ASCII letter or digit
 * (`日本語`, whose handler is `Handler`), which `nameDistinct` numbers when two files have it.
 */
function toGroupName(fileName: string) {
  if (fileName === '__root') return '__root'
  const base = toHandlerVarName(fileName).replace(/Handler$/u, '')
  if (base === '') return '_'
  return RESERVED.has(base) ? `__${base}` : base
}

/**
 * A name per file, no two the same and none of them in `taken`: in the order of the file
 * names, the first file of a name keeps it and a later one is numbered (`freeName`), past
 * every name a file has of its own, so that no file loses its name to another file's number.
 * A name in `taken` is numbered even when one file alone has it.
 */
function nameDistinct(
  fileNames: readonly string[],
  nameOf: (fileName: string) => string,
  taken: readonly string[],
) {
  const files = [...new Set(fileNames)].toSorted()
  const own = files.map(nameOf)
  return files.reduce((names, file) => {
    const base = nameOf(file)
    const given = [...taken, ...names.values()]
    return names.set(file, given.includes(base) ? freeName(base, [...own, ...given]) : base)
  }, new Map<string, string>())
}

/**
 * The export of each handler file of a handlers directory (`fileNames`, without `.ts`), as
 * `toHandlerVarName` names it. Two files whose names differ only in what is no letter or digit
 * (`user-profiles.ts` and `user_profiles.ts`, `__root.ts` and `root.ts`) would export one
 * name, which the barrel and the app entry cannot hold twice, so the later file is numbered:
 * `userProfilesHandler` and `userProfilesHandler2`. `definitions` are the `defineHandler`
 * definitions (`nameOperations`), which a handler file imports beside its own export: a
 * numbered export takes none of their names.
 */
export function nameHandlers(fileNames: readonly string[], definitions: readonly string[] = []) {
  const names = nameDistinct(fileNames, toHandlerVarName, definitions)
  return (fileName: string) => names.get(fileName) ?? toHandlerVarName(fileName)
}

/**
 * The group of each handler file of a split app, as `toGroupName` names it and distinct the
 * way `nameHandlers` is (`userProfiles` and `userProfiles2`). The app entry imports the
 * handlers beside the groups it exports, so a group does not take a handler's name either
 * (`/pets-handler` beside `/pets` is `petsHandler2`).
 */
export function nameGroups(fileNames: readonly string[], definitions: readonly string[] = []) {
  const handlerOf = nameHandlers(fileNames, definitions)
  const names = nameDistinct(fileNames, toGroupName, fileNames.map(handlerOf))
  return (fileName: string) => names.get(fileName) ?? toGroupName(fileName)
}

/**
 * The app entry: every handler routed on one app, under the base path. `api` is the app with
 * every route. With `split`, each handler file is a group exported under its name instead, so
 * that a client of one group resolves the routes of that group and not of the whole app; the
 * routes are still registered on the one app. The app is bound as `app`, unless a group takes
 * that name.
 *
 * The handlers are registered in the order of their file names, those of `last` after the
 * others: Hono answers with the first registered route that matches, and a file whose routes
 * start at a path parameter (`/{slug}`) would answer for every file registered after it.
 */
export function makeAppCode(
  handlerFileNames: readonly string[],
  options: {
    readonly basePath: string | undefined
    readonly handlersImport: string
    readonly split?: boolean | undefined
    /** The `defineHandler` definitions, whose names no numbered handler takes. */
    readonly definitions?: readonly string[] | undefined
    /** The handler files registered after the others: those of a first-segment parameter. */
    readonly last?: readonly string[] | undefined
  },
) {
  const sorted = handlerFileNames.toSorted()
  const last = new Set(options.last)
  const files = [
    ...sorted.filter((file) => !last.has(file)),
    ...sorted.filter((file) => last.has(file)),
  ]
  const handlerOf = nameHandlers(sorted, options.definitions)
  const groupOf = nameGroups(sorted, options.definitions)
  const names = files.map(handlerOf)
  const app = options.split === true ? freeName('app', files.map(groupOf)) : 'app'
  const created = options.basePath
    ? `new Hono().basePath(${JSON.stringify(options.basePath)})`
    : 'new Hono()'
  const routes =
    options.split === true
      ? files
          .map((file) => `export const ${groupOf(file)}=${app}.route('/',${handlerOf(file)})`)
          .join('\n\n')
      : `export const api=app${names.map((name) => `.route('/',${name})`).join('')}`
  return `import{Hono}from'hono'\nimport{${sorted.map(handlerOf).join(',')}}from'${options.handlersImport}'\n\nconst ${app}=${created}\n\n${routes}\n\nexport default ${app}`
}
