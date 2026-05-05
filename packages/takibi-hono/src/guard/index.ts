import type { Header, Media, Operation, Parameter, Reference, Schema } from '../openapi/index.js'

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

export function isParameter(v: unknown): v is Parameter {
  return typeof v === 'object' && v !== null && 'name' in v && 'in' in v && 'schema' in v
}

export function isOperation(v: unknown): v is Operation {
  return typeof v === 'object' && v !== null && 'responses' in v
}

export function isHeader(v: unknown): v is Header {
  return typeof v === 'object' && v !== null && !('$ref' in v)
}

export function isMedia(v: unknown): v is Media {
  return typeof v === 'object' && v !== null && 'schema' in v && !('$ref' in v)
}

export function isRefObject(v: unknown): v is Reference {
  return (
    typeof v === 'object' &&
    v !== null &&
    '$ref' in v &&
    typeof (v as { $ref: unknown }).$ref === 'string'
  )
}

export function isSchemaArray(items: Schema | readonly Schema[]): items is readonly Schema[] {
  return Array.isArray(items)
}

export function isNullable(schema: Schema): boolean {
  if (schema.nullable === true) return true
  if (Array.isArray(schema.type) && schema.type.includes('null')) return true
  return false
}
