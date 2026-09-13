import type { ComponentAdapter, Components, Operation, Schema, SchemaLib } from 'oas-truth'
import {
  makeSchemaIdentifiers,
  makeSchemaReplacements,
  schemaRefToName,
  toIdentifierPascalCase,
  valueToCode,
} from 'oas-truth'

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
      .filter(([key]) => DESCRIBE_ROUTE_KEYS.has(key))
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
 * `[target, expression]` per Hono validator: one object schema per parameter
 * location (schema-to-library applies the wire coercion for `query` / `path`),
 * then one per body target (`application/json` wins over other JSON types).
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
      return parameter?.schema ? [[`${parameter.in}:${parameter.name}`, parameter] as const] : []
    }),
  )
  const parameterValidators = PARAMETER_LOCATIONS.flatMap((location) => {
    const group = [...parameters.values()].filter((parameter) => parameter.in === location)
    if (group.length === 0) return []
    const schema: Schema = {
      type: 'object',
      properties: Object.fromEntries(
        group.map((parameter) => [parameter.name, parameter.schema ?? {}]),
      ),
      required: group
        .filter((parameter) => location === 'path' || parameter.required === true)
        .map((parameter) => parameter.name),
    }
    const paramIn = location === 'path' || location === 'query' ? location : undefined
    return [
      [location === 'path' ? 'param' : location, adapter.toExpression(schema, paramIn)] as const,
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
    return chosen ? [[target, adapter.toExpression(chosen.schema)] as const] : []
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

export function makeAppCode(
  handlerFileNames: readonly string[],
  options: { readonly basePath: string | undefined; readonly handlersImport: string },
) {
  const names = handlerFileNames.toSorted().map(toHandlerVarName)
  const app = options.basePath
    ? `new Hono().basePath(${JSON.stringify(options.basePath)})`
    : 'new Hono()'
  return `import{Hono}from'hono'\nimport{${names.join(',')}}from'${options.handlersImport}'\n\nconst app=${app}\n\nexport const api=app${names.map((name) => `.route('/',${name})`).join('')}\n\nexport default app`
}
