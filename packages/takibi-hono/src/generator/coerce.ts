import { isSchemaArray } from '../guard/index.js'
import type { Schema } from '../openapi/index.js'
import { schemaToInlineExpression } from './inline-schema.js'

/**
 * Returns a coerced expression for query parameters that need type conversion.
 * HTTP query parameters are always strings, so non-string types
 * need coercion to convert from string representation.
 *
 * Uses each library's built-in coercion where available:
 * - zod: z.coerce.number(), z.stringbool()
 * - valibot: v.toNumber()
 * - arktype: 'string.numeric.parse', 'string.integer.parse'
 * - effect: Schema.NumberFromString, Schema.BooleanFromString
 *
 * Returns undefined if no coercion is needed (e.g., string type).
 */
export function coerceQueryExpression(schema: Schema, schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'): string | undefined {
  const type = schema.type
  if (!type || Array.isArray(type)) return undefined

  switch (type) {
    case 'number':
      return coerceNumber(schemaLib)
    case 'integer':
      return coerceInteger(schemaLib)
    case 'boolean':
      return coerceBoolean(schemaLib)
    case 'array':
      return coerceArray(schema, schemaLib)
    case 'object':
      return coerceObject(schema, schemaLib)
    default:
      return undefined
  }
}

function coerceNumber(schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'): string {
  switch (schemaLib) {
    case 'zod':
      return 'z.coerce.number()'
    case 'valibot':
      return 'v.pipe(v.string(),v.toNumber())'
    case 'typebox':
      return 'Type.Decode(Type.String(),(v)=>Number(v))'
    case 'arktype':
      return "type('string.numeric.parse')"
    case 'effect':
      return 'Schema.NumberFromString'
  }
}

function coerceInteger(schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'): string {
  switch (schemaLib) {
    case 'zod':
      return 'z.coerce.number().pipe(z.int())'
    case 'valibot':
      return 'v.pipe(v.string(),v.toNumber(),v.integer())'
    case 'typebox':
      return 'Type.Decode(Type.String(),(v)=>parseInt(v,10))'
    case 'arktype':
      return "type('string.integer.parse')"
    case 'effect':
      return 'Schema.compose(Schema.NumberFromString,Schema.Int)'
  }
}

function coerceBoolean(schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'): string {
  switch (schemaLib) {
    case 'zod':
      return 'z.stringbool()'
    case 'valibot':
      return "v.pipe(v.string(),v.transform(v=>v==='true'))"
    case 'typebox':
      return "Type.Decode(Type.String(),(v)=>v==='true')"
    case 'arktype':
      return "type(\"'true'|'false'\").pipe(s=>s==='true')"
    case 'effect':
      return 'Schema.BooleanFromString'
  }
}

/**
 * Returns a coerced array expression for query parameters.
 * Query arrays arrive as string[] (e.g., ?tag=a&tag=b).
 * Items of non-string types need per-element coercion.
 */
function coerceArray(schema: Schema, schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'): string | undefined {
  const itemSchema = singleItems(schema.items)
  if (!itemSchema) return undefined

  const itemCoercion = coerceQueryExpression(itemSchema, schemaLib)
  if (!itemCoercion) {
    // Items are string or uncoerced — no coercion needed for the array
    return undefined
  }

  switch (schemaLib) {
    case 'zod':
      return `z.array(${itemCoercion})`
    case 'valibot':
      return `v.array(${itemCoercion})`
    case 'typebox':
      return `Type.Array(${itemCoercion})`
    case 'arktype':
      return `${itemCoercion}.array()`
    case 'effect':
      return `Schema.Array(${itemCoercion})`
  }
}

/**
 * Returns a coerced object expression for query parameters.
 * Query objects arrive as JSON strings, so we parse them.
 */
function coerceObject(schema: Schema, schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect'): string | undefined {
  const inner = schemaToInlineExpression(schema, schemaLib)
  switch (schemaLib) {
    case 'zod':
      return `z.string().pipe(z.transform((v)=>JSON.parse(v)),${inner})`
    case 'valibot':
      return `v.pipe(v.string(),v.transform((v)=>JSON.parse(v)),${inner})`
    case 'typebox':
      return `Type.Decode(Type.String(),(v)=>JSON.parse(v))`
    case 'arktype':
      return `type('string').pipe((s)=>JSON.parse(s))`
    case 'effect':
      return `Schema.compose(Schema.parseJson,${inner})`
  }
}

function singleItems(items: Schema | readonly Schema[] | undefined): Schema | undefined {
  if (!items) return undefined
  if (isSchemaArray(items)) return items[0]
  return items
}
