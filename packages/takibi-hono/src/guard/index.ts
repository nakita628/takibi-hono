import type { Header, Media, Operation, Parameter, Reference, Schema } from '../openapi/index.js'

/**
 * Checks if a string is a valid HTTP method.
 */
export function isHttpMethod(
  method: string,
): method is 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace' {
  return (
    method === 'get' ||
    method === 'put' ||
    method === 'post' ||
    method === 'delete' ||
    method === 'patch' ||
    method === 'options' ||
    method === 'head' ||
    method === 'trace'
  )
}

/**
 * Checks if a value is an OpenAPI Parameter object (has name, in, schema).
 */
export function isParameter(value: unknown): value is Parameter {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'in' in value &&
    'schema' in value
  )
}

/**
 * Checks if a value is an OpenAPI Operation object (has responses).
 */
export function isOperation(value: unknown): value is Operation {
  return typeof value === 'object' && value !== null && 'responses' in value
}

/**
 * Checks if a value is an OpenAPI Header object (not a $ref).
 */
export function isHeader(value: unknown): value is Header {
  return typeof value === 'object' && value !== null && !('$ref' in value)
}

/**
 * Checks if a value is an OpenAPI Media object (has schema).
 */
export function isMedia(value: unknown): value is Media {
  return typeof value === 'object' && value !== null && 'schema' in value && !('$ref' in value)
}

/**
 * Checks if a value is a $ref object.
 */
export function isRefObject(value: unknown): value is Reference {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$ref' in value &&
    typeof (value as { $ref: unknown }).$ref === 'string'
  )
}

/**
 * Checks if items is an array of schemas (tuple form).
 */
export function isSchemaArray(items: Schema | readonly Schema[]): items is readonly Schema[] {
  return Array.isArray(items)
}

/**
 * Checks if a schema is nullable (OpenAPI 3.0 nullable or type array with null).
 */
export function isNullable(schema: Schema): boolean {
  if (schema.nullable === true) return true
  if (Array.isArray(schema.type) && schema.type.includes('null')) return true
  return false
}
