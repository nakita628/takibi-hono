import { describe, expect, it } from 'vite-plus/test'

import {
  isHeader,
  isHttpMethod,
  isMedia,
  isNullable,
  isOperation,
  isParameter,
  isRefObject,
  isSchemaArray,
} from './index.js'

describe('isHttpMethod', () => {
  it.concurrent('should return true for valid HTTP methods', () => {
    expect(isHttpMethod('get')).toBe(true)
    expect(isHttpMethod('put')).toBe(true)
    expect(isHttpMethod('post')).toBe(true)
    expect(isHttpMethod('delete')).toBe(true)
    expect(isHttpMethod('patch')).toBe(true)
    expect(isHttpMethod('options')).toBe(true)
    expect(isHttpMethod('head')).toBe(true)
    expect(isHttpMethod('trace')).toBe(true)
  })

  it.concurrent('should return false for non-HTTP method strings', () => {
    expect(isHttpMethod('parameters')).toBe(false)
    expect(isHttpMethod('summary')).toBe(false)
    expect(isHttpMethod('description')).toBe(false)
    expect(isHttpMethod('')).toBe(false)
  })
})

describe('isParameter', () => {
  it.concurrent('should return true for valid Parameter object', () => {
    expect(isParameter({ name: 'id', in: 'path', schema: { type: 'string' } })).toBe(true)
  })

  it.concurrent('should return false for missing name', () => {
    expect(isParameter({ in: 'path', schema: { type: 'string' } })).toBe(false)
  })

  it.concurrent('should return false for missing in', () => {
    expect(isParameter({ name: 'id', schema: { type: 'string' } })).toBe(false)
  })

  it.concurrent('should return false for missing schema', () => {
    expect(isParameter({ name: 'id', in: 'path' })).toBe(false)
  })

  it.concurrent('should return false for null', () => {
    expect(isParameter(null)).toBe(false)
  })

  it.concurrent('should return false for string', () => {
    expect(isParameter('not a parameter')).toBe(false)
  })
})

describe('isOperation', () => {
  it.concurrent('should return true for valid Operation object', () => {
    expect(isOperation({ responses: { '200': { description: 'OK' } } })).toBe(true)
  })

  it.concurrent('should return false for missing responses', () => {
    expect(isOperation({ description: 'test' })).toBe(false)
  })

  it.concurrent('should return false for null', () => {
    expect(isOperation(null)).toBe(false)
  })

  it.concurrent('should return false for string', () => {
    expect(isOperation('not an operation')).toBe(false)
  })
})

describe('isHeader', () => {
  it.concurrent('should return true for valid Header object', () => {
    expect(isHeader({ description: 'Auth header' })).toBe(true)
  })

  it.concurrent('should return true for empty object (no $ref)', () => {
    expect(isHeader({})).toBe(true)
  })

  it.concurrent('should return false for $ref object', () => {
    expect(isHeader({ $ref: '#/components/headers/X-Rate-Limit' })).toBe(false)
  })

  it.concurrent('should return false for null', () => {
    expect(isHeader(null)).toBe(false)
  })

  it.concurrent('should return false for string', () => {
    expect(isHeader('not a header')).toBe(false)
  })
})

describe('isMedia', () => {
  it.concurrent('should return true for valid Media with schema', () => {
    expect(isMedia({ schema: { type: 'string' } })).toBe(true)
  })

  it.concurrent('should return false for $ref object', () => {
    expect(isMedia({ $ref: '#/components/schemas/Pet' })).toBe(false)
  })

  it.concurrent('should return false for object without schema', () => {
    expect(isMedia({ example: 'test' })).toBe(false)
  })

  it.concurrent('should return false for null', () => {
    expect(isMedia(null)).toBe(false)
  })

  it.concurrent('should return false for string', () => {
    expect(isMedia('not media')).toBe(false)
  })
})

describe('isRefObject', () => {
  it.concurrent('should return true for $ref object', () => {
    expect(isRefObject({ $ref: '#/components/schemas/Pet' })).toBe(true)
  })

  it.concurrent('should return false for non-string $ref', () => {
    expect(isRefObject({ $ref: 123 })).toBe(false)
  })

  it.concurrent('should return false for no $ref', () => {
    expect(isRefObject({ name: 'test' })).toBe(false)
  })

  it.concurrent('should return false for null', () => {
    expect(isRefObject(null)).toBe(false)
  })
})

describe('isSchemaArray', () => {
  it.concurrent('should return true for array of schemas', () => {
    expect(isSchemaArray([{ type: 'string' }, { type: 'number' }])).toBe(true)
  })

  it.concurrent('should return false for single schema', () => {
    expect(isSchemaArray({ type: 'string' })).toBe(false)
  })
})

describe('isNullable', () => {
  it.concurrent('should return true for nullable: true', () => {
    expect(isNullable({ nullable: true })).toBe(true)
  })

  it.concurrent('should return true for type array with null', () => {
    expect(isNullable({ type: ['string', 'null'] })).toBe(true)
  })

  it.concurrent('should return false for non-nullable schema', () => {
    expect(isNullable({ type: 'string' })).toBe(false)
  })

  it.concurrent('should return false for type array without null', () => {
    expect(isNullable({ type: ['string', 'number'] })).toBe(false)
  })

  it.concurrent('should return false for empty schema', () => {
    expect(isNullable({})).toBe(false)
  })
})
