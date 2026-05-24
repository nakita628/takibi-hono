import { isSchemaArray } from '../guard/index.js'
import type { Schema } from '../openapi/index.js'
import { schemaToInlineExpression } from './inline-schema.js'

/** HTTP query/path arrive as strings — non-string types need lib-specific coercion. Returns undefined when no coercion is needed. */
export function coerceQueryExpression(
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
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

function coerceNumber(schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect') {
  switch (schemaLib) {
    case 'zod':
      return 'z.coerce.number()'
    case 'valibot':
      return 'v.pipe(v.string(),v.toNumber())'
    case 'typebox':
      // typebox: conversion happens in the validator wrapper via Value.Convert.
      return 'Type.Number()'
    case 'arktype':
      return "type('string.numeric.parse')"
    case 'effect':
      return 'Schema.NumberFromString'
  }
}

function coerceInteger(schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect') {
  switch (schemaLib) {
    case 'zod':
      return 'z.coerce.number().pipe(z.int())'
    case 'valibot':
      return 'v.pipe(v.string(),v.toNumber(),v.integer())'
    case 'typebox':
      return 'Type.Integer()'
    case 'arktype':
      return "type('string.integer.parse')"
    case 'effect':
      return 'Schema.compose(Schema.NumberFromString,Schema.Int)'
  }
}

function coerceBoolean(schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect') {
  switch (schemaLib) {
    case 'zod':
      return 'z.stringbool()'
    case 'valibot':
      return "v.pipe(v.string(),v.transform(v=>v==='true'))"
    case 'typebox':
      return 'Type.Boolean()'
    case 'arktype':
      return "type(\"'true'|'false'\").pipe(s=>s==='true')"
    case 'effect':
      return 'Schema.BooleanFromString'
  }
}

/** Query arrays arrive as string[] (e.g., ?tag=a&tag=b); coerce per-element. */
function coerceArray(
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
): string | undefined {
  const itemSchema = singleItems(schema.items)
  if (!itemSchema) return undefined

  const itemCoercion = coerceQueryExpression(itemSchema, schemaLib)
  if (!itemCoercion) return undefined

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

/** Query objects arrive as JSON strings; parse first then validate. */
function coerceObject(
  schema: Schema,
  schemaLib: 'zod' | 'valibot' | 'typebox' | 'arktype' | 'effect',
) {
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

function singleItems(items: Schema | readonly Schema[] | undefined) {
  if (!items) return undefined
  if (isSchemaArray(items)) return items[0]
  return items
}
