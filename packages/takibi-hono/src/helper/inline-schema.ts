import { isNullable, isSchemaArray } from '../guard/index.js'
import type { Schema } from '../openapi/index.js'
import { resolveRef } from '../utils/index.js'
import { extractSchemaExports } from './schema-expression.js'

/**
 * Extracts a single Schema from items (ignoring array/tuple form).
 */
function singleItems(items: Schema | readonly Schema[] | undefined) {
  if (!items) return undefined
  if (isSchemaArray(items)) return items[0]
  return items
}

/**
 * Converts an OpenAPI Schema to an inline validation library expression.
 *
 * - Top-level `$ref`: returns bare reference (e.g. `UserSchema`).
 * - With meta (`description` / `example` / `examples` / `deprecated`):
 *   delegates to `schema-to-library` so each library gets its idiomatic meta
 *   encoding (`.meta` / `v.pipe(...,v.metadata)` / `Type.X(...,opts)` /
 *   `.describe` / `.annotations`). Lazy/suspend wrappers around nested $refs
 *   are unwrapped because inline schemas live next to their referenced ones.
 * - Without meta: hand-written body generation for backward-compat.
 */
export function schemaToInlineExpression(
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  if (schema.$ref) {
    return resolveRef(schema.$ref)
  }
  if (hasMeta(schema)) {
    return inlineViaSchemaLibrary(schema, schemaLib)
  }
  // Handle allOf/anyOf/oneOf combinators before dispatching to library
  if (schema.allOf) {
    return handleAllOf(schema.allOf, schemaLib)
  }
  if (schema.oneOf) {
    return handleUnion(schema.oneOf, schemaLib)
  }
  if (schema.anyOf) {
    return handleUnion(schema.anyOf, schemaLib)
  }
  switch (schemaLib) {
    case 'zod':
      return zodInline(schema)
    case 'valibot':
      return valibotInline(schema)
    case 'typebox':
      return typeboxInline(schema)
    case 'arktype':
      return arktypeInline(schema)
    case 'effect':
      return effectInline(schema)
  }
}

function hasMeta(schema: Schema): boolean {
  return Boolean(
    schema.description ||
    schema.example !== undefined ||
    schema.examples !== undefined ||
    schema.deprecated === true,
  )
}

function inlineViaSchemaLibrary(
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
): string {
  // exportType=false suppresses the trailing `export type X = ...` line.
  const code = extractSchemaExports('Inline', schema, schemaLib, false, false)
  // Strip the leading `export const <Name>Schema = `.
  const expr = code
    .trim()
    .replace(/^export\s+const\s+[A-Za-z_$][\w$]*Schema\s*=\s*/, '')
    .trim()
  return unwrapLazyRefs(expr, schemaLib)
}

/**
 * schema-to-library wraps every $ref with `z.lazy(() => X)` (zod),
 * `v.lazy(() => X)` (valibot), or `Schema.suspend(() => X)` (effect) to support
 * forward references in component declarations. For inline schemas embedded in
 * handler files, the referenced schemas are imported alongside, so we strip
 * those wrappers to keep the generated code compact.
 */
function unwrapLazyRefs(
  expr: string,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
): string {
  const refToken = /([A-Za-z_$][A-Za-z0-9_$]*Schema)/.source
  switch (schemaLib) {
    case 'zod':
      return expr.replace(new RegExp(`z\\.lazy\\(\\(\\)\\s*=>\\s*${refToken}\\)`, 'g'), '$1')
    case 'valibot':
      return expr.replace(new RegExp(`v\\.lazy\\(\\(\\)\\s*=>\\s*${refToken}\\)`, 'g'), '$1')
    case 'effect':
      return expr.replace(
        new RegExp(`Schema\\.suspend\\(\\(\\)\\s*=>\\s*${refToken}\\)`, 'g'),
        '$1',
      )
    default:
      return expr
  }
}

function handleAllOf(
  schemas: readonly Schema[],
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
): string {
  const exprs = schemas.map((s) => schemaToInlineExpression(s, schemaLib))
  if (exprs.length === 1) return exprs[0]
  switch (schemaLib) {
    case 'zod':
      return exprs.reduce((acc, e) => `z.intersection(${acc},${e})`)
    case 'valibot':
      return `v.intersect([${exprs.join(',')}])`
    case 'typebox':
      return `Type.Intersect([${exprs.join(',')}])`
    case 'arktype': {
      if (exprs.every(isArktypeStringForm)) {
        const strs = exprs.map((e) => extractArktypeString(e))
        return `type('${strs.join(' & ')}')`
      }
      return exprs.reduce((acc, e) => `${acc}.and(${e})`)
    }
    case 'effect':
      return exprs.reduce((acc, e) => `Schema.extend(${acc},${e})`)
  }
}

function handleUnion(
  schemas: readonly Schema[],
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
): string {
  const exprs = schemas.map((s) => schemaToInlineExpression(s, schemaLib))
  if (exprs.length === 1) return exprs[0]
  switch (schemaLib) {
    case 'zod':
      return `z.union([${exprs.join(',')}])`
    case 'valibot':
      return `v.union([${exprs.join(',')}])`
    case 'typebox':
      return `Type.Union([${exprs.join(',')}])`
    case 'arktype': {
      if (exprs.every(isArktypeStringForm)) {
        const strs = exprs.map((e) => extractArktypeString(e))
        return `type('${strs.join(' | ')}')`
      }
      return exprs.reduce((acc, e) => `${acc}.or(${e})`)
    }
    case 'effect':
      return `Schema.Union(${exprs.join(',')})`
  }
}

function wrapNullable(
  expr: string,
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
  if (!isNullable(schema)) return expr
  switch (schemaLib) {
    case 'zod':
      return `${expr}.nullable()`
    case 'valibot':
      return `v.nullable(${expr})`
    case 'typebox':
      return `Type.Union([${expr},Type.Null()])`
    case 'arktype':
      return isArktypeStringForm(expr)
        ? `type('${extractArktypeString(expr)} | null')`
        : `${expr}.or('null')`
    case 'effect':
      return `Schema.NullOr(${expr})`
  }
}

/**
 * Extracts the arktype string from a type('...') expression.
 * Returns the inner string if matched, otherwise returns the original expression.
 */
function extractArktypeString(expr: string) {
  const match = expr.match(/^type\('(.+)'\)$/)
  if (match) return match[1]
  return expr
}

/**
 * Returns true if the expression is an arktype string-definition form: type('...').
 * Returns false for object-definition form: type({...}), variable refs, or chained calls.
 */
function isArktypeStringForm(expr: string) {
  return /^type\('(.+)'\)$/.test(expr)
}

function zodInlineExpr(schema: Schema): string {
  if (schema.enum) {
    return schema.enum.map((v) => JSON.stringify(v)).join(',')
      ? `z.enum([${schema.enum.map((v) => JSON.stringify(v)).join(',')}])`
      : 'z.unknown()'
  }
  const type = Array.isArray(schema.type)
    ? (schema.type.find((t) => t !== 'null') ?? schema.type[0])
    : schema.type
  switch (type) {
    case 'string':
      return 'z.string()'
    case 'number':
      return 'z.number()'
    case 'integer':
      return 'z.int()'
    case 'boolean':
      return 'z.boolean()'
    case 'array': {
      const itemSchema = singleItems(schema.items)
      if (!itemSchema) return 'z.array(z.unknown())'
      const itemExpr = itemSchema.$ref ? resolveRef(itemSchema.$ref) : zodInline(itemSchema)
      return `z.array(${itemExpr})`
    }
    case 'object': {
      if (schema.additionalProperties && !schema.properties) {
        const valueExpr =
          schema.additionalProperties === true
            ? 'z.unknown()'
            : schemaToInlineExpression(schema.additionalProperties, 'zod')
        return `z.record(z.string(),${valueExpr})`
      }
      if (!schema.properties) return 'z.object({})'
      const props = Object.entries(schema.properties).map(([key, prop]) => {
        const isRequired = schema.required?.includes(key)
        const propExpr = zodInline(prop)
        return `${key}:${isRequired ? propExpr : `${propExpr}.optional()`}`
      })
      return `z.object({${props.join(',')}})`
    }
    default:
      return 'z.unknown()'
  }
}

function zodInline(schema: Schema) {
  if (schema.$ref) return resolveRef(schema.$ref)
  if (schema.enum) {
    const values = schema.enum.map((v) => JSON.stringify(v)).join(',')
    return wrapNullable(`z.enum([${values}])`, schema, 'zod')
  }
  return wrapNullable(zodInlineExpr(schema), schema, 'zod')
}

function valibotInline(schema: Schema): string {
  if (schema.$ref) return resolveRef(schema.$ref)
  if (schema.enum) {
    const values = schema.enum.map((v) => JSON.stringify(v)).join(',')
    return wrapNullable(`v.picklist([${values}])`, schema, 'valibot')
  }
  const type = Array.isArray(schema.type)
    ? (schema.type.find((t) => t !== 'null') ?? schema.type[0])
    : schema.type
  const expr = ((): string => {
    switch (type) {
      case 'string':
        return 'v.string()'
      case 'number':
      case 'integer':
        return 'v.number()'
      case 'boolean':
        return 'v.boolean()'
      case 'array': {
        const itemSchema = singleItems(schema.items)
        if (!itemSchema) return 'v.array(v.unknown())'
        const itemExpr = itemSchema.$ref ? resolveRef(itemSchema.$ref) : valibotInline(itemSchema)
        return `v.array(${itemExpr})`
      }
      case 'object': {
        if (schema.additionalProperties && !schema.properties) {
          const valueExpr =
            schema.additionalProperties === true
              ? 'v.unknown()'
              : schemaToInlineExpression(schema.additionalProperties, 'valibot')
          return `v.record(v.string(),${valueExpr})`
        }
        if (!schema.properties) return 'v.object({})'
        const props = Object.entries(schema.properties).map(([key, prop]) => {
          const isRequired = schema.required?.includes(key)
          const propExpr = valibotInline(prop)
          return `${key}:${isRequired ? propExpr : `v.optional(${propExpr})`}`
        })
        return `v.object({${props.join(',')}})`
      }
      default:
        return 'v.unknown()'
    }
  })()
  return wrapNullable(expr, schema, 'valibot')
}

function typeboxInline(schema: Schema) {
  if (schema.$ref) return resolveRef(schema.$ref)
  if (schema.enum) {
    const values = schema.enum.map((v) => `Type.Literal(${JSON.stringify(v)})`).join(',')
    const expr = `Type.Union([${values}])`
    return wrapNullable(expr, schema, 'typebox')
  }

  const type = Array.isArray(schema.type)
    ? (schema.type.find((t) => t !== 'null') ?? schema.type[0])
    : schema.type
  const expr = ((): string => {
    switch (type) {
      case 'string':
        return 'Type.String()'
      case 'number':
        return 'Type.Number()'
      case 'integer':
        return 'Type.Integer()'
      case 'boolean':
        return 'Type.Boolean()'
      case 'array': {
        const itemSchema = singleItems(schema.items)
        if (!itemSchema) return 'Type.Array(Type.Unknown())'
        const itemExpr = itemSchema.$ref ? resolveRef(itemSchema.$ref) : typeboxInline(itemSchema)
        return `Type.Array(${itemExpr})`
      }
      case 'object': {
        if (schema.additionalProperties && !schema.properties) {
          const valueExpr =
            schema.additionalProperties === true
              ? 'Type.Unknown()'
              : schemaToInlineExpression(schema.additionalProperties, 'typebox')
          return `Type.Record(Type.String(),${valueExpr})`
        }
        if (!schema.properties) return 'Type.Object({})'
        const props = Object.entries(schema.properties).map(([key, prop]) => {
          const isRequired = schema.required?.includes(key)
          const propExpr = typeboxInline(prop)
          return `${key}:${isRequired ? propExpr : `Type.Optional(${propExpr})`}`
        })
        return `Type.Object({${props.join(',')}})`
      }
      default:
        return 'Type.Unknown()'
    }
  })()
  return wrapNullable(expr, schema, 'typebox')
}

function arktypeInline(schema: Schema) {
  if (schema.$ref) return resolveRef(schema.$ref)
  if (schema.enum) {
    const values = schema.enum.map((v) => JSON.stringify(v)).join(' | ')
    return wrapNullable(`type('${values}')`, schema, 'arktype')
  }
  const type = Array.isArray(schema.type)
    ? (schema.type.find((t) => t !== 'null') ?? schema.type[0])
    : schema.type
  const expr = ((): string => {
    switch (type) {
      case 'string':
        return "type('string')"
      case 'number':
      case 'integer':
        return "type('number')"
      case 'boolean':
        return "type('boolean')"
      case 'array': {
        const itemSchema = singleItems(schema.items)
        if (!itemSchema) return "type('unknown[]')"
        if (itemSchema.$ref) return `${resolveRef(itemSchema.$ref)}.array()`
        const itemExpr = arktypeInline(itemSchema)
        if (isArktypeStringForm(itemExpr)) {
          return `type('${extractArktypeString(itemExpr)}[]')`
        }
        return `${itemExpr}.array()`
      }
      case 'object': {
        if (schema.additionalProperties && !schema.properties) {
          const valueExpr =
            schema.additionalProperties === true
              ? 'unknown'
              : extractArktypeString(
                  schemaToInlineExpression(schema.additionalProperties, 'arktype'),
                )
          return `type('Record<string,${valueExpr}>')`
        }
        if (!schema.properties) return 'type({})'
        const props = Object.entries(schema.properties).map(([key, prop]) => {
          const isRequired = schema.required?.includes(key)
          const propStr = extractArktypeString(arktypeInline(prop))
          const keyStr = isRequired ? `'${key}'` : `'${key}?'`
          return `${keyStr}:${JSON.stringify(propStr)}`
        })
        return `type({${props.join(',')}})`
      }
      default:
        return "type('unknown')"
    }
  })()
  return wrapNullable(expr, schema, 'arktype')
}

function effectInline(schema: Schema) {
  if (schema.$ref) return resolveRef(schema.$ref)
  if (schema.enum) {
    const values = schema.enum.map((v) => `Schema.Literal(${JSON.stringify(v)})`).join(',')
    return wrapNullable(`Schema.Union(${values})`, schema, 'effect')
  }
  const type = Array.isArray(schema.type)
    ? (schema.type.find((t) => t !== 'null') ?? schema.type[0])
    : schema.type
  const expr = ((): string => {
    switch (type) {
      case 'string':
        return 'Schema.String'
      case 'number':
      case 'integer':
        return 'Schema.Number'
      case 'boolean':
        return 'Schema.Boolean'
      case 'array': {
        const itemSchema = singleItems(schema.items)
        if (!itemSchema) return 'Schema.Array(Schema.Unknown)'
        const itemExpr = itemSchema.$ref ? resolveRef(itemSchema.$ref) : effectInline(itemSchema)
        return `Schema.Array(${itemExpr})`
      }
      case 'object': {
        if (schema.additionalProperties && !schema.properties) {
          const valueExpr =
            schema.additionalProperties === true
              ? 'Schema.Unknown'
              : schemaToInlineExpression(schema.additionalProperties, 'effect')
          return `Schema.Record({key:Schema.String,value:${valueExpr}})`
        }
        if (!schema.properties) return 'Schema.Struct({})'
        const props = Object.entries(schema.properties).map(([key, prop]) => {
          const isRequired = schema.required?.includes(key)
          const propExpr = effectInline(prop)
          return `${key}:${isRequired ? propExpr : `Schema.optional(${propExpr})`}`
        })
        return `Schema.Struct({${props.join(',')}})`
      }
      default:
        return 'Schema.Unknown'
    }
  })()
  return wrapNullable(expr, schema, 'effect')
}
