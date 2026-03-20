import { describe, expect, it } from 'vite-plus/test'

import type { Schema } from '../openapi/index.js'
import { coerceQueryExpression } from './coerce.js'

const libraries = ['zod', 'valibot', 'typebox', 'arktype', 'effect'] as const

describe('coerceQueryExpression', () => {
  describe('number', () => {
    const schema: Schema = { type: 'number' }

    it.concurrent('zod', () => {
      expect(coerceQueryExpression(schema, 'zod')).toBe('z.coerce.number()')
    })

    it.concurrent('valibot', () => {
      expect(coerceQueryExpression(schema, 'valibot')).toBe('v.pipe(v.string(),v.toNumber())')
    })

    it.concurrent('typebox', () => {
      expect(coerceQueryExpression(schema, 'typebox')).toBe(
        'Type.Decode(Type.String(),(v)=>Number(v))',
      )
    })

    it.concurrent('arktype', () => {
      expect(coerceQueryExpression(schema, 'arktype')).toBe("type('string.numeric.parse')")
    })

    it.concurrent('effect', () => {
      expect(coerceQueryExpression(schema, 'effect')).toBe('Schema.NumberFromString')
    })
  })

  describe('integer', () => {
    const schema: Schema = { type: 'integer' }

    it.concurrent('zod', () => {
      expect(coerceQueryExpression(schema, 'zod')).toBe('z.coerce.number().pipe(z.int())')
    })

    it.concurrent('valibot', () => {
      expect(coerceQueryExpression(schema, 'valibot')).toBe(
        'v.pipe(v.string(),v.toNumber(),v.integer())',
      )
    })

    it.concurrent('typebox', () => {
      expect(coerceQueryExpression(schema, 'typebox')).toBe(
        'Type.Decode(Type.String(),(v)=>parseInt(v,10))',
      )
    })

    it.concurrent('arktype', () => {
      expect(coerceQueryExpression(schema, 'arktype')).toBe("type('string.integer.parse')")
    })

    it.concurrent('effect', () => {
      expect(coerceQueryExpression(schema, 'effect')).toBe(
        'Schema.compose(Schema.NumberFromString,Schema.Int)',
      )
    })
  })

  describe('boolean', () => {
    const schema: Schema = { type: 'boolean' }

    it.concurrent('zod', () => {
      expect(coerceQueryExpression(schema, 'zod')).toBe('z.stringbool()')
    })

    it.concurrent('valibot', () => {
      expect(coerceQueryExpression(schema, 'valibot')).toBe(
        "v.pipe(v.string(),v.transform(v=>v==='true'))",
      )
    })

    it.concurrent('typebox', () => {
      expect(coerceQueryExpression(schema, 'typebox')).toBe(
        "Type.Decode(Type.String(),(v)=>v==='true')",
      )
    })

    it.concurrent('arktype', () => {
      expect(coerceQueryExpression(schema, 'arktype')).toBe(
        "type(\"'true'|'false'\").pipe(s=>s==='true')",
      )
    })

    it.concurrent('effect', () => {
      expect(coerceQueryExpression(schema, 'effect')).toBe('Schema.BooleanFromString')
    })
  })

  describe('array with string items', () => {
    const schema: Schema = { type: 'array', items: { type: 'string' } }

    for (const lib of libraries) {
      it.concurrent(`${lib} returns undefined (no coercion needed)`, () => {
        expect(coerceQueryExpression(schema, lib)).toBeUndefined()
      })
    }
  })

  describe('array with integer items', () => {
    const schema: Schema = { type: 'array', items: { type: 'integer' } }

    it.concurrent('zod', () => {
      expect(coerceQueryExpression(schema, 'zod')).toBe('z.array(z.coerce.number().pipe(z.int()))')
    })

    it.concurrent('valibot', () => {
      expect(coerceQueryExpression(schema, 'valibot')).toBe(
        'v.array(v.pipe(v.string(),v.toNumber(),v.integer()))',
      )
    })

    it.concurrent('typebox', () => {
      expect(coerceQueryExpression(schema, 'typebox')).toBe(
        'Type.Array(Type.Decode(Type.String(),(v)=>parseInt(v,10)))',
      )
    })

    it.concurrent('arktype', () => {
      expect(coerceQueryExpression(schema, 'arktype')).toBe("type('string.integer.parse').array()")
    })

    it.concurrent('effect', () => {
      expect(coerceQueryExpression(schema, 'effect')).toBe(
        'Schema.Array(Schema.compose(Schema.NumberFromString,Schema.Int))',
      )
    })
  })

  describe('array with number items', () => {
    const schema: Schema = { type: 'array', items: { type: 'number' } }

    it.concurrent('zod', () => {
      expect(coerceQueryExpression(schema, 'zod')).toBe('z.array(z.coerce.number())')
    })

    it.concurrent('valibot', () => {
      expect(coerceQueryExpression(schema, 'valibot')).toBe(
        'v.array(v.pipe(v.string(),v.toNumber()))',
      )
    })

    it.concurrent('typebox', () => {
      expect(coerceQueryExpression(schema, 'typebox')).toBe(
        'Type.Array(Type.Decode(Type.String(),(v)=>Number(v)))',
      )
    })

    it.concurrent('arktype', () => {
      expect(coerceQueryExpression(schema, 'arktype')).toBe("type('string.numeric.parse').array()")
    })

    it.concurrent('effect', () => {
      expect(coerceQueryExpression(schema, 'effect')).toBe('Schema.Array(Schema.NumberFromString)')
    })
  })

  describe('array with boolean items', () => {
    const schema: Schema = { type: 'array', items: { type: 'boolean' } }

    it.concurrent('zod', () => {
      expect(coerceQueryExpression(schema, 'zod')).toBe('z.array(z.stringbool())')
    })

    it.concurrent('valibot', () => {
      expect(coerceQueryExpression(schema, 'valibot')).toBe(
        "v.array(v.pipe(v.string(),v.transform(v=>v==='true')))",
      )
    })

    it.concurrent('typebox', () => {
      expect(coerceQueryExpression(schema, 'typebox')).toBe(
        "Type.Array(Type.Decode(Type.String(),(v)=>v==='true'))",
      )
    })

    it.concurrent('arktype', () => {
      expect(coerceQueryExpression(schema, 'arktype')).toBe(
        "type(\"'true'|'false'\").pipe(s=>s==='true').array()",
      )
    })

    it.concurrent('effect', () => {
      expect(coerceQueryExpression(schema, 'effect')).toBe('Schema.Array(Schema.BooleanFromString)')
    })
  })

  describe('array without items', () => {
    const schema: Schema = { type: 'array' }

    for (const lib of libraries) {
      it.concurrent(`${lib} returns undefined`, () => {
        expect(coerceQueryExpression(schema, lib)).toBeUndefined()
      })
    }
  })

  describe('object', () => {
    const schema: Schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    }

    it.concurrent('zod', () => {
      expect(coerceQueryExpression(schema, 'zod')).toBe(
        'z.string().pipe(z.transform((v)=>JSON.parse(v)),z.object({name:z.string()}))',
      )
    })

    it.concurrent('valibot', () => {
      expect(coerceQueryExpression(schema, 'valibot')).toBe(
        'v.pipe(v.string(),v.transform((v)=>JSON.parse(v)),v.object({name:v.string()}))',
      )
    })

    it.concurrent('typebox', () => {
      expect(coerceQueryExpression(schema, 'typebox')).toBe(
        'Type.Decode(Type.String(),(v)=>JSON.parse(v))',
      )
    })

    it.concurrent('arktype', () => {
      expect(coerceQueryExpression(schema, 'arktype')).toBe(
        "type('string').pipe((s)=>JSON.parse(s))",
      )
    })

    it.concurrent('effect', () => {
      expect(coerceQueryExpression(schema, 'effect')).toBe(
        'Schema.compose(Schema.parseJson,Schema.Struct({name:Schema.String}))',
      )
    })
  })

  describe('string', () => {
    const schema: Schema = { type: 'string' }

    for (const lib of libraries) {
      it.concurrent(`${lib} returns undefined`, () => {
        expect(coerceQueryExpression(schema, lib)).toBeUndefined()
      })
    }
  })

  describe('no type', () => {
    const schema: Schema = {}

    for (const lib of libraries) {
      it.concurrent(`${lib} returns undefined`, () => {
        expect(coerceQueryExpression(schema, lib)).toBeUndefined()
      })
    }
  })

  describe('array type (union type)', () => {
    const schema: Schema = { type: ['string', 'number'] }

    for (const lib of libraries) {
      it.concurrent(`${lib} returns undefined for union type array`, () => {
        expect(coerceQueryExpression(schema, lib)).toBeUndefined()
      })
    }
  })

  describe('array with tuple-form items (Schema[])', () => {
    const schema: Schema = { type: 'array', items: [{ type: 'number' }] as unknown as Schema }

    it.concurrent('zod', () => {
      expect(coerceQueryExpression(schema, 'zod')).toBe('z.array(z.coerce.number())')
    })

    it.concurrent('valibot', () => {
      expect(coerceQueryExpression(schema, 'valibot')).toBe(
        'v.array(v.pipe(v.string(),v.toNumber()))',
      )
    })

    it.concurrent('typebox', () => {
      expect(coerceQueryExpression(schema, 'typebox')).toBe(
        'Type.Array(Type.Decode(Type.String(),(v)=>Number(v)))',
      )
    })

    it.concurrent('arktype', () => {
      expect(coerceQueryExpression(schema, 'arktype')).toBe("type('string.numeric.parse').array()")
    })

    it.concurrent('effect', () => {
      expect(coerceQueryExpression(schema, 'effect')).toBe('Schema.Array(Schema.NumberFromString)')
    })
  })

  describe('array with tuple-form items containing string (no coercion)', () => {
    const schema: Schema = { type: 'array', items: [{ type: 'string' }] as unknown as Schema }

    for (const lib of libraries) {
      it.concurrent(`${lib} returns undefined`, () => {
        expect(coerceQueryExpression(schema, lib)).toBeUndefined()
      })
    }
  })
})
