import { describe, expect, it } from 'vite-plus/test'

import type { Components } from '../../../openapi/index.js'
import { makeHeadersCode } from './headers.js'

describe('makeHeadersCode', () => {
  it.concurrent('should generate required header schema (zod)', async () => {
    const headers: NonNullable<Components['headers']> = {
      'X-Request-Id': {
        description: 'Unique request identifier',
        required: true,
        schema: { type: 'string' },
      },
    }
    const result = await makeHeadersCode(headers, 'zod')
    expect(result).toBe('export const XRequestIdHeaderSchema=z.string()')
  })

  it.concurrent('should generate optional header schema (zod)', async () => {
    const headers: NonNullable<Components['headers']> = {
      'X-Rate-Limit': {
        description: 'Rate limit remaining',
        schema: { type: 'integer' },
      },
    }
    const result = await makeHeadersCode(headers, 'zod')
    expect(result).toBe('export const XRateLimitHeaderSchema=z.int().optional()')
  })

  it.concurrent('should generate header from $ref', async () => {
    const headers: NonNullable<Components['headers']> = {
      'X-Token': {
        $ref: '#/components/schemas/Token',
      },
    }
    const result = await makeHeadersCode(headers, 'zod')
    expect(result).toBe('export const XTokenHeaderSchema=TokenSchema')
  })
})
