import { isHeader, isMedia, isParameter, isRefObject } from '../guard/index.js'
import type {
  Components,
  Content,
  Header,
  Media,
  Operation,
  Parameter,
  PathItem,
  Reference,
  Schema,
} from '../openapi/index.js'
import { makeStatusKey, resolveRef } from '../utils/index.js'
import { schemaToInlineExpression } from './inline-schema.js'

/** Returns the local component name when `value` is `{ $ref: '${prefix}<name>' }`. */
function localRefName(value: unknown, prefix: string) {
  if (!isRefObject(value)) return undefined
  const ref = value.$ref
  return typeof ref === 'string' && ref.startsWith(prefix) ? ref.slice(prefix.length) : undefined
}

/** Resolves `{ $ref: '#/components/pathItems/X' }` → `components.pathItems[X]`. */
export function resolvePathItemRef(
  pathItem: unknown,
  components: Components | undefined,
): PathItem | undefined {
  if (!pathItem || typeof pathItem !== 'object') return undefined
  if (!isRefObject(pathItem)) return pathItem
  const name = localRefName(pathItem, '#/components/pathItems/')
  return name === undefined ? undefined : components?.pathItems?.[name]
}

/** Resolves `{ $ref: '#/components/parameters/X' }` → `components.parameters[X]`. */
export function resolveParameterRef(param: unknown, components: Components | undefined) {
  if (isParameter(param)) return param
  const name = localRefName(param, '#/components/parameters/')
  const resolved = name === undefined ? undefined : components?.parameters?.[name]
  return isParameter(resolved) ? resolved : undefined
}

/** Resolves `{ $ref: '#/components/requestBodies/X' }` → `components.requestBodies[X]`. */
export function resolveRequestBodyRef(
  body: Operation['requestBody'] | Reference | undefined,
  components: Components | undefined,
) {
  if (!body) return undefined
  if (!isRefObject(body)) return 'content' in body ? body : undefined
  const name = localRefName(body, '#/components/requestBodies/')
  return name === undefined ? undefined : components?.requestBodies?.[name]
}

export function makeOptional(
  expr: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  switch (schemaLib) {
    case 'zod':
      return `${expr}.exactOptional()`
    case 'valibot':
      return `v.optional(${expr})`
    case 'typebox':
      return `Type.Optional(${expr})`
    case 'arktype':
      return `${expr}.optional()`
    case 'effect':
      return `Schema.optional(${expr})`
  }
}

export function makeObjectExpression(
  fields: readonly string[],
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  const inner = fields.join(',')
  switch (schemaLib) {
    case 'zod':
      return `z.object({${inner}})`
    case 'valibot':
      return `v.object({${inner}})`
    case 'typebox':
      return `Type.Object({${inner}})`
    case 'arktype':
      return `type({${inner}})`
    case 'effect':
      return `Schema.Struct({${inner}})`
  }
}

export function wrapSchemaForValidator(
  expr: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  switch (schemaLib) {
    case 'effect':
      return `standardSchemaV1(${expr})`
    case 'typebox':
      return `Compile(${expr})`
    case 'zod':
    case 'valibot':
    case 'arktype':
      return expr
  }
}

export function makeExternalDocsPart(externalDocs: NonNullable<Operation['externalDocs']>): string {
  const parts = [
    `url:${JSON.stringify(externalDocs.url)}`,
    ...(externalDocs.description
      ? [`description:${JSON.stringify(externalDocs.description)}`]
      : []),
  ]
  return `externalDocs:{${parts.join(',')}}`
}

export function makeServersPart(servers: NonNullable<Operation['servers']>): string {
  const entries = servers.map((server) => {
    const result = [
      `url:${JSON.stringify(server.url)}`,
      ...(server.description ? [`description:${JSON.stringify(server.description)}`] : []),
      ...(server.variables
        ? [
            `variables:{${Object.entries(server.variables)
              .map(([k, v]) => {
                const result = [
                  ...(v.enum ? [`enum:${JSON.stringify(v.enum)}`] : []),
                  ...(v.default !== undefined ? [`default:${JSON.stringify(v.default)}`] : []),
                  ...(v.description ? [`description:${JSON.stringify(v.description)}`] : []),
                ]
                return `${k}:{${result.join(',')}}`
              })
              .join(',')}}`,
          ]
        : []),
    ]
    return `{${result.join(',')}}`
  })
  return `servers:[${entries.join(',')}]`
}

export function groupParametersByLocation(allParams: readonly unknown[], components?: Components) {
  return allParams
    .map((p) => resolveParameterRef(p, components))
    .filter((p): p is Parameter => p !== undefined)
    .reduce<{
      readonly [k: string]: {
        readonly name: string
        readonly schema: Schema
        readonly required: boolean
      }[]
    }>(
      (acc, param) => ({
        ...acc,
        [param.in]: [
          ...(acc[param.in] ?? []),
          { name: param.name, schema: param.schema, required: param.required === true },
        ] as const,
      }),
      {},
    )
}

/**
 * @internal Exported only for unit tests; consumers should use `makeContent` /
 * `makeResponse` which route through this function. `useOpenAPI=true` wraps in
 * hono-openapi's `resolver(...)`; `false` emits the bare schema (plain mode).
 */
export function resolveSchema(
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  useOpenAPI = true,
) {
  const expr = schema.$ref ? resolveRef(schema.$ref) : schemaToInlineExpression(schema, schemaLib)
  if (!useOpenAPI) return expr
  const wrapped = wrapSchemaForValidator(expr, schemaLib)
  return `resolver(${wrapped})`
}

export function makeContent(
  content: Content | { [k: string]: unknown },
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  useOpenAPI = true,
): readonly string[] {
  return Object.entries(content)
    .filter((entry): entry is [string, Media] => isMedia(entry[1]) && !!entry[1].schema)
    .map(
      ([mediaType, media]) =>
        `'${mediaType}':{schema:${resolveSchema(media.schema, schemaLib, useOpenAPI)}}`,
    )
}

export function makeHeader(headerName: string, header: Header | Reference) {
  if (isRefObject(header) && header.$ref) {
    return `${JSON.stringify(headerName)}:${resolveRef(header.$ref)}`
  }
  if (!isHeader(header)) {
    return `${JSON.stringify(headerName)}:{}`
  }
  const parts = [
    ...(header.description ? [`description:${JSON.stringify(header.description)}`] : []),
    ...(header.schema ? [`schema:${JSON.stringify(header.schema)} as const`] : []),
    ...(header.required === true ? ['required:true'] : []),
    ...(header.deprecated === true ? ['deprecated:true'] : []),
  ]
  return `${JSON.stringify(headerName)}:{${parts.join(',')}}`
}

export function makeResponse(
  statusCode: string,
  response: {
    readonly $ref?: string
    readonly description?: string
    readonly content?: Content
    readonly headers?: { [k: string]: Header | Reference }
  },
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  if (response.$ref) {
    return `${makeStatusKey(statusCode)}:${resolveRef(response.$ref)}`
  }
  const parts = [
    ...(response.description ? [`description:${JSON.stringify(response.description)}`] : []),
    ...(response.content
      ? (() => {
          const contentEntries = Object.entries(response.content)
            .filter((entry): entry is [string, Media] => isMedia(entry[1]) && !!entry[1].schema)
            .map(
              ([mediaType, media]) =>
                `'${mediaType}':{schema:${resolveSchema(media.schema, schemaLib)}}`,
            )
          return contentEntries.length > 0 ? [`content:{${contentEntries.join(',')}}`] : []
        })()
      : []),
    ...(response.headers
      ? (() => {
          const headerEntries = Object.entries(response.headers).map(([name, header]) =>
            makeHeader(name, header),
          )
          return headerEntries.length > 0 ? [`headers:{${headerEntries.join(',')}}`] : []
        })()
      : []),
  ]
  return `${makeStatusKey(statusCode)}:{${parts.join(',')}}`
}
