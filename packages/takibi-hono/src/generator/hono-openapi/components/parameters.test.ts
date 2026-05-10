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

  describe('exportTypes', () => {
    const single: NonNullable<Components['parameters']> = {
      UserId: { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
    }

    it.concurrent('emits type export when exportTypes=true (zod)', async () => {
      const result = await makeParametersCode(single, 'zod', true)
      expect(result).toBe(
        'export const UserIdParamsSchema=z.string()\nexport type UserIdParams=z.infer<typeof UserIdParamsSchema>',
      )
    })

    it.concurrent('emits type export when exportTypes=true (valibot)', async () => {
      const result = await makeParametersCode(single, 'valibot', true)
      expect(result).toBe(
        'export const UserIdParamsSchema=v.string()\nexport type UserIdParams=v.InferOutput<typeof UserIdParamsSchema>',
      )
    })

    it.concurrent('emits type export when exportTypes=true (typebox)', async () => {
      const result = await makeParametersCode(single, 'typebox', true)
      expect(result).toBe(
        'export const UserIdParamsSchema=Type.String()\nexport type UserIdParams=Static<typeof UserIdParamsSchema>',
      )
    })

    it.concurrent('emits type export when exportTypes=true (arktype)', async () => {
      const result = await makeParametersCode(single, 'arktype', true)
      expect(result).toBe(
        "export const UserIdParamsSchema=type('string')\nexport type UserIdParams=typeof UserIdParamsSchema.infer",
      )
    })

    it.concurrent('emits type export when exportTypes=true (effect)', async () => {
      const result = await makeParametersCode(single, 'effect', true)
      expect(result).toBe(
        'export const UserIdParamsSchema=Schema.String\nexport type UserIdParams=typeof UserIdParamsSchema.Encoded',
      )
    })

    it.concurrent('does NOT emit type export when exportTypes is omitted', async () => {
      const result = await makeParametersCode(single, 'zod')
      expect(result).toBe('export const UserIdParamsSchema=z.string()')
    })
  })
})
