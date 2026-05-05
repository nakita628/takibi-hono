import { describe, expect, it } from 'vite-plus/test'

import type { Components } from '../../../openapi/index.js'
import { makeParametersCode } from './parameters.js'

describe('makeParametersCode', () => {
  it.concurrent('should generate required parameter schema (zod)', async () => {
    const parameters: NonNullable<Components['parameters']> = {
      UserId: {
        name: 'userId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    }
    const result = await makeParametersCode(parameters, 'zod')
    expect(result).toBe('export const UserIdParamsSchema=z.string()')
  })

  it.concurrent('should generate optional parameter schema (zod)', async () => {
    const parameters: NonNullable<Components['parameters']> = {
      PageParam: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer' },
      },
    }
    const result = await makeParametersCode(parameters, 'zod')
    expect(result).toBe('export const PageParamParamsSchema=z.int().optional()')
  })

  it.concurrent('should generate multiple parameter schemas', async () => {
    const parameters: NonNullable<Components['parameters']> = {
      PageParam: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer' },
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        required: true,
        schema: { type: 'integer' },
      },
    }
    const result = await makeParametersCode(parameters, 'zod')
    expect(result).toBe(
      'export const PageParamParamsSchema=z.int().optional()\n\nexport const LimitParamParamsSchema=z.int()',
    )
  })

  it.concurrent('should generate parameter schema (effect)', async () => {
    const parameters: NonNullable<Components['parameters']> = {
      UserId: {
        name: 'userId',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    }
    const result = await makeParametersCode(parameters, 'effect')
    expect(result).toBe('export const UserIdParamsSchema=Schema.String')
  })
})
