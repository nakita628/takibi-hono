import { describe, expect, it } from 'vite-plus/test'

import type { Components } from '../../../openapi/index.js'
import { makeMediaTypesCode } from './media-types.js'

describe('makeMediaTypesCode', () => {
  it.concurrent('should generate inline media type schema (zod)', async () => {
    const mediaTypes: NonNullable<Components['mediaTypes']> = {
      JsonMedia: {
        schema: {
          type: 'object',
          properties: { id: { type: 'integer' } },
          required: ['id'],
        },
      },
    }
    const result = makeMediaTypesCode(mediaTypes, 'zod')
    expect(result).toBe('export const JsonMediaMediaTypeSchema=z.object({id:z.int()})')
  })

  it.concurrent('should generate media type from schema $ref (zod)', async () => {
    const mediaTypes: NonNullable<Components['mediaTypes']> = {
      UserMedia: {
        schema: { $ref: '#/components/schemas/User' },
      },
    }
    const result = makeMediaTypesCode(mediaTypes, 'zod')
    expect(result).toBe('export const UserMediaMediaTypeSchema=UserSchema')
  })

  it.concurrent('should generate media type from media $ref (zod)', async () => {
    const mediaTypes: NonNullable<Components['mediaTypes']> = {
      JsonMedia: {
        $ref: '#/components/mediaTypes/Other',
      },
    }
    const result = makeMediaTypesCode(mediaTypes, 'zod')
    expect(result).toBe('export const JsonMediaMediaTypeSchema=OtherMediaTypeSchema')
  })

  it.concurrent('should generate inline media type schema (valibot)', async () => {
    const mediaTypes: NonNullable<Components['mediaTypes']> = {
      JsonMedia: {
        schema: { type: 'string' },
      },
    }
    const result = makeMediaTypesCode(mediaTypes, 'valibot')
    expect(result).toBe('export const JsonMediaMediaTypeSchema=v.string()')
  })

  it.concurrent('should generate inline media type schema (typebox)', async () => {
    const mediaTypes: NonNullable<Components['mediaTypes']> = {
      JsonMedia: {
        schema: { type: 'string' },
      },
    }
    const result = makeMediaTypesCode(mediaTypes, 'typebox')
    expect(result).toBe('export const JsonMediaMediaTypeSchema=Type.String()')
  })
})
