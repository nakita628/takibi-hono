import { describe, expect, it } from 'vite-plus/test'

import type { Components } from '../../../openapi/index.js'
import { makeHeadersCode } from './headers.js'

describe('makeHeadersCode', () => {
  it.concurrent('emits a Header Object with the schema as a JSON Schema literal', async () => {
    const headers: NonNullable<Components['headers']> = {
      'X-Request-Id': {
        description: 'Unique request identifier',
        required: true,
        schema: { type: 'string' },
      },
    }
    const result = await makeHeadersCode(headers)
    expect(result).toBe(
      'export const XRequestIdHeaderSchema={description:"Unique request identifier",schema:{"type":"string"} as const,required:true}',
    )
  })

  it.concurrent('omits required when the header is optional (no schema-level optional)', async () => {
    const headers: NonNullable<Components['headers']> = {
      'X-Rate-Limit': {
        description: 'Rate limit remaining',
        schema: { type: 'integer' },
      },
    }
    const result = await makeHeadersCode(headers)
    expect(result).toBe(
      'export const XRateLimitHeaderSchema={description:"Rate limit remaining",schema:{"type":"integer"} as const}',
    )
  })

  it.concurrent('resolves a $ref header to its component identifier', async () => {
    const headers: NonNullable<Components['headers']> = {
      'X-Token': {
        $ref: '#/components/schemas/Token',
      },
    }
    const result = await makeHeadersCode(headers)
    expect(result).toBe('export const XTokenHeaderSchema=TokenSchema')
  })
})
