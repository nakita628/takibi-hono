import { schemaToInlineExpression } from '../generator/inline-schema.js'
import { isHeader, isMedia, isParameter, isRefObject } from '../guard/index.js'
import type {
  Content,
  Header,
  Media,
  Operation,
  Parameter,
  Reference,
  Schema,
} from '../openapi/index.js'
import {
  resolveRef, } from '../utils/index.js'

export function makeOptional(
  expr: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  switch (schemaLib) {
    case 'zod':
      return `${expr}.optional()`
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
    const parts = [
      `url:${JSON.stringify(server.url)}`,
      ...(server.description ? [`description:${JSON.stringify(server.description)}`] : []),
      ...(server.variables
        ? [
            `variables:{${Object.entries(server.variables)
              .map(([key, val]) => {
                const vParts = [
                  ...(val.enum ? [`enum:${JSON.stringify(val.enum)}`] : []),
                  ...(val.default !== undefined ? [`default:${JSON.stringify(val.default)}`] : []),
                  ...(val.description ? [`description:${JSON.stringify(val.description)}`] : []),
                ]
                return `${key}:{${vParts.join(',')}}`
              })
              .join(',')}}`,
          ]
        : []),
    ]
    return `{${parts.join(',')}}`
  })
  return `servers:[${entries.join(',')}]`
}

export function groupParametersByLocation(allParams: readonly unknown[]): {
  [k: string]: readonly {
    readonly name: string
    readonly schema: Schema
    readonly required: boolean
  }[]
} {
  return allParams
    .filter((param): param is Parameter => !isRefObject(param) && isParameter(param))
    .reduce<{
      [k: string]: { readonly name: string; readonly schema: Schema; readonly required: boolean }[]
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

export function resolveSchema(
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  const expr = schema.$ref ? resolveRef(schema.$ref) : schemaToInlineExpression(schema, schemaLib)
  const wrapped = wrapSchemaForValidator(expr, schemaLib)
  return `resolver(${wrapped})`
}

export function makeContent(
  content: Content | { [k: string]: unknown },
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
  options?: { readonly wrapWithResolver?: boolean },
): readonly string[] {
  const wrap = options?.wrapWithResolver ?? false
  return Object.entries(content)
    .filter((entry): entry is [string, Media] => isMedia(entry[1]) && !!entry[1].schema)
    .map(([mediaType, media]) => {
      const { schema } = media
      if (wrap) {
        return `'${mediaType}':{schema:${resolveSchema(schema, schemaLib)}}`
      }
      const schemaExpr = schema.$ref
        ? resolveRef(schema.$ref)
        : schemaToInlineExpression(schema, schemaLib)
      return `'${mediaType}':{schema:resolver(${schemaExpr})}`
    })
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
    return `${statusCode}:${resolveRef(response.$ref)}`
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
  return `${statusCode}:{${parts.join(',')}}`
}
