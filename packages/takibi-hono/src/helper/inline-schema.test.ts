import { describe, expect, it } from 'vite-plus/test'

import type { Schema } from '../openapi/index.js'
import { schemaToInlineExpression } from './inline-schema.js'

describe('schemaToInlineExpression', () => {
  // --- $ref ---
  describe('$ref', () => {
    it.concurrent('should return ref name', () => {
      const schema: Schema = { $ref: '#/components/schemas/User' }
      expect(schemaToInlineExpression(schema, 'zod')).toBe('UserSchema')
      expect(schemaToInlineExpression(schema, 'valibot')).toBe('UserSchema')
      expect(schemaToInlineExpression(schema, 'typebox')).toBe('UserSchema')
      expect(schemaToInlineExpression(schema, 'arktype')).toBe('UserSchema')
      expect(schemaToInlineExpression(schema, 'effect')).toBe('UserSchema')
    })
  })

  // --- allOf/anyOf/oneOf ---
  describe('allOf', () => {
    it.concurrent('zod: should generate intersection', () => {
      const schema: Schema = {
        allOf: [{ $ref: '#/components/schemas/Base' }, { $ref: '#/components/schemas/Extra' }],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe('z.intersection(BaseSchema,ExtraSchema)')
    })

    it.concurrent('valibot: should generate intersect', () => {
      const schema: Schema = {
        allOf: [{ $ref: '#/components/schemas/Base' }, { $ref: '#/components/schemas/Extra' }],
      }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe(
        'v.intersect([BaseSchema,ExtraSchema])',
      )
    })

    it.concurrent('typebox: should generate Intersect', () => {
      const schema: Schema = {
        allOf: [{ $ref: '#/components/schemas/Base' }, { $ref: '#/components/schemas/Extra' }],
      }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe(
        'Type.Intersect([BaseSchema,ExtraSchema])',
      )
    })

    it.concurrent('arktype: should generate & expression', () => {
      const schema: Schema = {
        allOf: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('string & number')")
    })

    it.concurrent('effect: should generate extend', () => {
      const schema: Schema = {
        allOf: [{ $ref: '#/components/schemas/Base' }, { $ref: '#/components/schemas/Extra' }],
      }
      expect(schemaToInlineExpression(schema, 'effect')).toBe(
        'Schema.extend(BaseSchema,ExtraSchema)',
      )
    })

    it.concurrent('zod: 3-element allOf chains intersection', () => {
      const schema: Schema = {
        allOf: [
          { $ref: '#/components/schemas/A' },
          { $ref: '#/components/schemas/B' },
          { $ref: '#/components/schemas/C' },
        ],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe(
        'z.intersection(z.intersection(ASchema,BSchema),CSchema)',
      )
    })

    it.concurrent('typebox: 3-element allOf uses Intersect array', () => {
      const schema: Schema = {
        allOf: [
          { $ref: '#/components/schemas/A' },
          { $ref: '#/components/schemas/B' },
          { $ref: '#/components/schemas/C' },
        ],
      }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe(
        'Type.Intersect([ASchema,BSchema,CSchema])',
      )
    })

    it.concurrent('valibot: 3-element allOf uses intersect array', () => {
      const schema: Schema = {
        allOf: [
          { $ref: '#/components/schemas/A' },
          { $ref: '#/components/schemas/B' },
          { $ref: '#/components/schemas/C' },
        ],
      }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe(
        'v.intersect([ASchema,BSchema,CSchema])',
      )
    })

    it.concurrent('effect: 3-element allOf chains extend', () => {
      const schema: Schema = {
        allOf: [
          { $ref: '#/components/schemas/A' },
          { $ref: '#/components/schemas/B' },
          { $ref: '#/components/schemas/C' },
        ],
      }
      expect(schemaToInlineExpression(schema, 'effect')).toBe(
        'Schema.extend(Schema.extend(ASchema,BSchema),CSchema)',
      )
    })

    it.concurrent('single allOf should return the expression directly', () => {
      const schema: Schema = {
        allOf: [{ $ref: '#/components/schemas/Base' }],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe('BaseSchema')
    })
  })

  describe('oneOf', () => {
    it.concurrent('zod: should generate union', () => {
      const schema: Schema = {
        oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe('z.union([CatSchema,DogSchema])')
    })

    it.concurrent('valibot: should generate union', () => {
      const schema: Schema = {
        oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
      }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe('v.union([CatSchema,DogSchema])')
    })

    it.concurrent('typebox: should generate Union', () => {
      const schema: Schema = {
        oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
      }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe('Type.Union([CatSchema,DogSchema])')
    })

    it.concurrent('arktype: should generate | expression', () => {
      const schema: Schema = {
        oneOf: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('string | number')")
    })

    it.concurrent('effect: should generate Union', () => {
      const schema: Schema = {
        oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
      }
      expect(schemaToInlineExpression(schema, 'effect')).toBe('Schema.Union(CatSchema,DogSchema)')
    })
  })

  describe('anyOf', () => {
    it.concurrent('zod: should generate union for anyOf', () => {
      const schema: Schema = {
        anyOf: [{ type: 'string' }, { type: 'integer' }],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe('z.union([z.string(),z.int()])')
    })
  })

  // --- additionalProperties ---
  describe('additionalProperties', () => {
    it.concurrent('zod: record with typed values', () => {
      const schema: Schema = { type: 'object', additionalProperties: { type: 'string' } }
      expect(schemaToInlineExpression(schema, 'zod')).toBe('z.record(z.string(),z.string())')
    })

    it.concurrent('zod: record with boolean true', () => {
      const schema: Schema = { type: 'object', additionalProperties: true }
      expect(schemaToInlineExpression(schema, 'zod')).toBe('z.record(z.string(),z.unknown())')
    })

    it.concurrent('valibot: record with typed values', () => {
      const schema: Schema = { type: 'object', additionalProperties: { type: 'number' } }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe('v.record(v.string(),v.number())')
    })

    it.concurrent('typebox: Record with typed values', () => {
      const schema: Schema = { type: 'object', additionalProperties: { type: 'integer' } }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe(
        'Type.Record(Type.String(),Type.Integer())',
      )
    })

    it.concurrent('arktype: Record with typed values', () => {
      const schema: Schema = { type: 'object', additionalProperties: { type: 'string' } }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('Record<string,string>')")
    })

    it.concurrent('effect: Record with typed values', () => {
      const schema: Schema = { type: 'object', additionalProperties: { type: 'boolean' } }
      expect(schemaToInlineExpression(schema, 'effect')).toBe(
        'Schema.Record({key:Schema.String,value:Schema.Boolean})',
      )
    })

    it.concurrent('zod: record with $ref values', () => {
      const schema: Schema = {
        type: 'object',
        additionalProperties: { $ref: '#/components/schemas/Item' },
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe('z.record(z.string(),ItemSchema)')
    })
  })

  // --- Zod ---
  describe('zod', () => {
    it.concurrent('string', () => {
      expect(schemaToInlineExpression({ type: 'string' }, 'zod')).toBe('z.string()')
    })
    it.concurrent('number', () => {
      expect(schemaToInlineExpression({ type: 'number' }, 'zod')).toBe('z.number()')
    })
    it.concurrent('integer', () => {
      expect(schemaToInlineExpression({ type: 'integer' }, 'zod')).toBe('z.int()')
    })
    it.concurrent('boolean', () => {
      expect(schemaToInlineExpression({ type: 'boolean' }, 'zod')).toBe('z.boolean()')
    })
    it.concurrent('array', () => {
      expect(schemaToInlineExpression({ type: 'array', items: { type: 'string' } }, 'zod')).toBe(
        'z.array(z.string())',
      )
    })
    it.concurrent('object', () => {
      const schema: Schema = {
        type: 'object',
        properties: { name: { type: 'string' }, age: { type: 'integer' } },
        required: ['name'],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe(
        'z.object({name:z.string(),age:z.int().optional()})',
      )
    })
    it.concurrent('enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 'b', 'c'] }, 'zod')).toBe(
        'z.enum(["a","b","c"])',
      )
    })
    it.concurrent('nullable string', () => {
      expect(schemaToInlineExpression({ type: 'string', nullable: true }, 'zod')).toBe(
        'z.string().nullable()',
      )
    })
    it.concurrent('nullable enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 'b'], nullable: true }, 'zod')).toBe(
        'z.enum(["a","b"]).nullable()',
      )
    })
  })

  // --- Valibot ---
  describe('valibot', () => {
    it.concurrent('string', () => {
      expect(schemaToInlineExpression({ type: 'string' }, 'valibot')).toBe('v.string()')
    })
    it.concurrent('number', () => {
      expect(schemaToInlineExpression({ type: 'number' }, 'valibot')).toBe('v.number()')
    })
    it.concurrent('boolean', () => {
      expect(schemaToInlineExpression({ type: 'boolean' }, 'valibot')).toBe('v.boolean()')
    })
    it.concurrent('array', () => {
      expect(
        schemaToInlineExpression({ type: 'array', items: { type: 'string' } }, 'valibot'),
      ).toBe('v.array(v.string())')
    })
    it.concurrent('object', () => {
      const schema: Schema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe('v.object({name:v.string()})')
    })
    it.concurrent('enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 'b', 'c'] }, 'valibot')).toBe(
        'v.picklist(["a","b","c"])',
      )
    })
    it.concurrent('nullable string', () => {
      expect(schemaToInlineExpression({ type: 'string', nullable: true }, 'valibot')).toBe(
        'v.nullable(v.string())',
      )
    })
  })

  // --- TypeBox ---
  describe('typebox', () => {
    it.concurrent('string', () => {
      expect(schemaToInlineExpression({ type: 'string' }, 'typebox')).toBe('Type.String()')
    })
    it.concurrent('integer', () => {
      expect(schemaToInlineExpression({ type: 'integer' }, 'typebox')).toBe('Type.Integer()')
    })
    it.concurrent('boolean', () => {
      expect(schemaToInlineExpression({ type: 'boolean' }, 'typebox')).toBe('Type.Boolean()')
    })
    it.concurrent('array', () => {
      expect(
        schemaToInlineExpression({ type: 'array', items: { type: 'number' } }, 'typebox'),
      ).toBe('Type.Array(Type.Number())')
    })
    it.concurrent('object', () => {
      const schema: Schema = {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id'],
      }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe('Type.Object({id:Type.Integer()})')
    })
    it.concurrent('enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 'b'] }, 'typebox')).toBe(
        'Type.Union([Type.Literal("a"),Type.Literal("b")])',
      )
    })
    it.concurrent('nullable string', () => {
      expect(schemaToInlineExpression({ type: 'string', nullable: true }, 'typebox')).toBe(
        'Type.Union([Type.String(),Type.Null()])',
      )
    })
  })

  // --- ArkType ---
  describe('arktype', () => {
    it.concurrent('string', () => {
      expect(schemaToInlineExpression({ type: 'string' }, 'arktype')).toBe("type('string')")
    })
    it.concurrent('number', () => {
      expect(schemaToInlineExpression({ type: 'number' }, 'arktype')).toBe("type('number')")
    })
    it.concurrent('boolean', () => {
      expect(schemaToInlineExpression({ type: 'boolean' }, 'arktype')).toBe("type('boolean')")
    })
    it.concurrent('enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 'b'] }, 'arktype')).toBe('type(\'"a" | "b"\')')
    })
    it.concurrent('array', () => {
      expect(
        schemaToInlineExpression({ type: 'array', items: { type: 'string' } }, 'arktype'),
      ).toBe("type('string[]')")
    })
    it.concurrent('object', () => {
      const schema: Schema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe('type({\'name\':"string"})')
    })
    it.concurrent('object with optional', () => {
      const schema: Schema = {
        type: 'object',
        properties: { name: { type: 'string' }, age: { type: 'number' } },
        required: ['name'],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe(
        'type({\'name\':"string",\'age?\':"number"})',
      )
    })
    it.concurrent('nullable string', () => {
      expect(schemaToInlineExpression({ type: 'string', nullable: true }, 'arktype')).toBe(
        "type('string | null')",
      )
    })
  })

  // --- Effect ---
  describe('effect', () => {
    it.concurrent('string', () => {
      expect(schemaToInlineExpression({ type: 'string' }, 'effect')).toBe('Schema.String')
    })
    it.concurrent('number', () => {
      expect(schemaToInlineExpression({ type: 'number' }, 'effect')).toBe('Schema.Number')
    })
    it.concurrent('boolean', () => {
      expect(schemaToInlineExpression({ type: 'boolean' }, 'effect')).toBe('Schema.Boolean')
    })
    it.concurrent('enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 'b'] }, 'effect')).toBe(
        'Schema.Union(Schema.Literal("a"),Schema.Literal("b"))',
      )
    })
    it.concurrent('array', () => {
      expect(schemaToInlineExpression({ type: 'array', items: { type: 'string' } }, 'effect')).toBe(
        'Schema.Array(Schema.String)',
      )
    })
    it.concurrent('object', () => {
      const schema: Schema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      }
      expect(schemaToInlineExpression(schema, 'effect')).toBe('Schema.Struct({name:Schema.String})')
    })
    it.concurrent('object with optional', () => {
      const schema: Schema = {
        type: 'object',
        properties: { name: { type: 'string' }, age: { type: 'number' } },
        required: ['name'],
      }
      expect(schemaToInlineExpression(schema, 'effect')).toBe(
        'Schema.Struct({name:Schema.String,age:Schema.optional(Schema.Number)})',
      )
    })
    it.concurrent('nullable string', () => {
      expect(schemaToInlineExpression({ type: 'string', nullable: true }, 'effect')).toBe(
        'Schema.NullOr(Schema.String)',
      )
    })
  })

  // --- 1. nullable: true for each schema library ---
  describe('nullable: true', () => {
    it.concurrent('zod: nullable number', () => {
      expect(schemaToInlineExpression({ type: 'number', nullable: true }, 'zod')).toBe(
        'z.number().nullable()',
      )
    })
    it.concurrent('zod: nullable integer', () => {
      expect(schemaToInlineExpression({ type: 'integer', nullable: true }, 'zod')).toBe(
        'z.int().nullable()',
      )
    })
    it.concurrent('zod: nullable boolean', () => {
      expect(schemaToInlineExpression({ type: 'boolean', nullable: true }, 'zod')).toBe(
        'z.boolean().nullable()',
      )
    })
    it.concurrent('valibot: nullable number', () => {
      expect(schemaToInlineExpression({ type: 'number', nullable: true }, 'valibot')).toBe(
        'v.nullable(v.number())',
      )
    })
    it.concurrent('valibot: nullable boolean', () => {
      expect(schemaToInlineExpression({ type: 'boolean', nullable: true }, 'valibot')).toBe(
        'v.nullable(v.boolean())',
      )
    })
    it.concurrent('valibot: nullable enum', () => {
      expect(schemaToInlineExpression({ enum: ['x', 'y'], nullable: true }, 'valibot')).toBe(
        'v.nullable(v.picklist(["x","y"]))',
      )
    })
    it.concurrent('typebox: nullable number', () => {
      expect(schemaToInlineExpression({ type: 'number', nullable: true }, 'typebox')).toBe(
        'Type.Union([Type.Number(),Type.Null()])',
      )
    })
    it.concurrent('typebox: nullable boolean', () => {
      expect(schemaToInlineExpression({ type: 'boolean', nullable: true }, 'typebox')).toBe(
        'Type.Union([Type.Boolean(),Type.Null()])',
      )
    })
    it.concurrent('typebox: nullable enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 'b'], nullable: true }, 'typebox')).toBe(
        'Type.Union([Type.Union([Type.Literal("a"),Type.Literal("b")]),Type.Null()])',
      )
    })
    it.concurrent('arktype: nullable number', () => {
      expect(schemaToInlineExpression({ type: 'number', nullable: true }, 'arktype')).toBe(
        "type('number | null')",
      )
    })
    it.concurrent('arktype: nullable boolean', () => {
      expect(schemaToInlineExpression({ type: 'boolean', nullable: true }, 'arktype')).toBe(
        "type('boolean | null')",
      )
    })
    it.concurrent('arktype: nullable enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 'b'], nullable: true }, 'arktype')).toBe(
        'type(\'"a" | "b" | null\')',
      )
    })
    it.concurrent('effect: nullable number', () => {
      expect(schemaToInlineExpression({ type: 'number', nullable: true }, 'effect')).toBe(
        'Schema.NullOr(Schema.Number)',
      )
    })
    it.concurrent('effect: nullable boolean', () => {
      expect(schemaToInlineExpression({ type: 'boolean', nullable: true }, 'effect')).toBe(
        'Schema.NullOr(Schema.Boolean)',
      )
    })
    it.concurrent('effect: nullable enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 'b'], nullable: true }, 'effect')).toBe(
        'Schema.NullOr(Schema.Union(Schema.Literal("a"),Schema.Literal("b")))',
      )
    })
  })

  // --- 2. allOf composition for each schema library ---
  describe('allOf composition with inline schemas', () => {
    it.concurrent('zod: allOf with inline object schemas', () => {
      const schema: Schema = {
        allOf: [
          { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
          { type: 'object', properties: { age: { type: 'integer' } }, required: ['age'] },
        ],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe(
        'z.intersection(z.object({name:z.string()}),z.object({age:z.int()}))',
      )
    })
    it.concurrent('valibot: allOf with inline object schemas', () => {
      const schema: Schema = {
        allOf: [
          { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
          { type: 'object', properties: { age: { type: 'number' } }, required: ['age'] },
        ],
      }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe(
        'v.intersect([v.object({name:v.string()}),v.object({age:v.number()})])',
      )
    })
    it.concurrent('typebox: allOf with inline object schemas', () => {
      const schema: Schema = {
        allOf: [
          { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
          { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
        ],
      }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe(
        'Type.Intersect([Type.Object({id:Type.Integer()}),Type.Object({name:Type.String()})])',
      )
    })
    it.concurrent('arktype: allOf with inline schemas', () => {
      const schema: Schema = {
        allOf: [{ type: 'boolean' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('boolean & number')")
    })
    it.concurrent('effect: allOf with inline object schemas', () => {
      const schema: Schema = {
        allOf: [
          { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
          { type: 'object', properties: { age: { type: 'number' } }, required: ['age'] },
        ],
      }
      expect(schemaToInlineExpression(schema, 'effect')).toBe(
        'Schema.extend(Schema.Struct({name:Schema.String}),Schema.Struct({age:Schema.Number}))',
      )
    })
  })

  // --- 3. oneOf for each schema library ---
  describe('oneOf with inline schemas', () => {
    it.concurrent('zod: oneOf with inline types', () => {
      const schema: Schema = {
        oneOf: [{ type: 'string' }, { type: 'integer' }, { type: 'boolean' }],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe(
        'z.union([z.string(),z.int(),z.boolean()])',
      )
    })
    it.concurrent('valibot: oneOf with inline types', () => {
      const schema: Schema = {
        oneOf: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe('v.union([v.string(),v.number()])')
    })
    it.concurrent('typebox: oneOf with inline types', () => {
      const schema: Schema = {
        oneOf: [{ type: 'string' }, { type: 'boolean' }],
      }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe(
        'Type.Union([Type.String(),Type.Boolean()])',
      )
    })
    it.concurrent('arktype: oneOf with inline types', () => {
      const schema: Schema = {
        oneOf: [{ type: 'string' }, { type: 'boolean' }],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('string | boolean')")
    })
    it.concurrent('effect: oneOf with inline types', () => {
      const schema: Schema = {
        oneOf: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'effect')).toBe(
        'Schema.Union(Schema.String,Schema.Number)',
      )
    })
    it.concurrent('single oneOf returns expression directly', () => {
      const schema: Schema = {
        oneOf: [{ type: 'string' }],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe('z.string()')
    })
  })

  // --- 4. enum values (string, numeric, mixed) ---
  describe('enum values', () => {
    it.concurrent('zod: numeric enum', () => {
      expect(schemaToInlineExpression({ enum: [1, 2, 3] }, 'zod')).toBe('z.enum([1,2,3])')
    })
    it.concurrent('zod: mixed enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 1, true] }, 'zod')).toBe('z.enum(["a",1,true])')
    })
    it.concurrent('valibot: numeric enum', () => {
      expect(schemaToInlineExpression({ enum: [1, 2, 3] }, 'valibot')).toBe('v.picklist([1,2,3])')
    })
    it.concurrent('valibot: mixed enum', () => {
      expect(schemaToInlineExpression({ enum: ['x', 42] }, 'valibot')).toBe('v.picklist(["x",42])')
    })
    it.concurrent('typebox: numeric enum', () => {
      expect(schemaToInlineExpression({ enum: [10, 20] }, 'typebox')).toBe(
        'Type.Union([Type.Literal(10),Type.Literal(20)])',
      )
    })
    it.concurrent('typebox: mixed enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 1] }, 'typebox')).toBe(
        'Type.Union([Type.Literal("a"),Type.Literal(1)])',
      )
    })
    it.concurrent('arktype: numeric enum', () => {
      expect(schemaToInlineExpression({ enum: [1, 2] }, 'arktype')).toBe("type('1 | 2')")
    })
    it.concurrent('arktype: mixed enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 1] }, 'arktype')).toBe('type(\'"a" | 1\')')
    })
    it.concurrent('effect: numeric enum', () => {
      expect(schemaToInlineExpression({ enum: [1, 2] }, 'effect')).toBe(
        'Schema.Union(Schema.Literal(1),Schema.Literal(2))',
      )
    })
    it.concurrent('effect: mixed enum', () => {
      expect(schemaToInlineExpression({ enum: ['a', 1] }, 'effect')).toBe(
        'Schema.Union(Schema.Literal("a"),Schema.Literal(1))',
      )
    })
  })

  // --- 5. additionalProperties (true and schema object) ---
  describe('additionalProperties for all libraries', () => {
    it.concurrent('valibot: record with boolean true', () => {
      const schema: Schema = { type: 'object', additionalProperties: true }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe('v.record(v.string(),v.unknown())')
    })
    it.concurrent('typebox: record with boolean true', () => {
      const schema: Schema = { type: 'object', additionalProperties: true }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe(
        'Type.Record(Type.String(),Type.Unknown())',
      )
    })
    it.concurrent('arktype: record with boolean true', () => {
      const schema: Schema = { type: 'object', additionalProperties: true }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('Record<string,unknown>')")
    })
    it.concurrent('effect: record with boolean true', () => {
      const schema: Schema = { type: 'object', additionalProperties: true }
      expect(schemaToInlineExpression(schema, 'effect')).toBe(
        'Schema.Record({key:Schema.String,value:Schema.Unknown})',
      )
    })
    it.concurrent('effect: record with typed values', () => {
      const schema: Schema = { type: 'object', additionalProperties: { type: 'string' } }
      expect(schemaToInlineExpression(schema, 'effect')).toBe(
        'Schema.Record({key:Schema.String,value:Schema.String})',
      )
    })
    it.concurrent('arktype: record with typed values number', () => {
      const schema: Schema = { type: 'object', additionalProperties: { type: 'number' } }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('Record<string,number>')")
    })
  })

  // --- 6. nested objects (object inside object) ---
  describe('nested objects', () => {
    it.concurrent('zod: nested object', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: { city: { type: 'string' }, zip: { type: 'string' } },
            required: ['city'],
          },
        },
        required: ['address'],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe(
        'z.object({address:z.object({city:z.string(),zip:z.string().optional()})})',
      )
    })
    it.concurrent('valibot: nested object', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: { city: { type: 'string' } },
            required: ['city'],
          },
        },
        required: ['address'],
      }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe(
        'v.object({address:v.object({city:v.string()})})',
      )
    })
    it.concurrent('typebox: nested object', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          meta: {
            type: 'object',
            properties: { version: { type: 'integer' } },
            required: ['version'],
          },
        },
        required: ['meta'],
      }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe(
        'Type.Object({meta:Type.Object({version:Type.Integer()})})',
      )
    })
    it.concurrent('arktype: nested object', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          meta: {
            type: 'object',
            properties: { version: { type: 'number' } },
            required: ['version'],
          },
        },
        required: ['meta'],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe(
        'type({\'meta\':"type({\'version\':\\"number\\"})"})',
      )
    })
    it.concurrent('effect: nested object', () => {
      const schema: Schema = {
        type: 'object',
        properties: {
          meta: {
            type: 'object',
            properties: { version: { type: 'number' } },
            required: ['version'],
          },
        },
        required: ['meta'],
      }
      expect(schemaToInlineExpression(schema, 'effect')).toBe(
        'Schema.Struct({meta:Schema.Struct({version:Schema.Number})})',
      )
    })
  })

  // --- 7. format types (email, uuid, date-time, uri) ---
  describe('format types', () => {
    // Note: The current implementation does not handle format specially,
    // so format is ignored and only the base type is used.
    it.concurrent('zod: string with format email', () => {
      expect(schemaToInlineExpression({ type: 'string', format: 'email' }, 'zod')).toBe(
        'z.string()',
      )
    })
    it.concurrent('zod: string with format uuid', () => {
      expect(schemaToInlineExpression({ type: 'string', format: 'uuid' }, 'zod')).toBe('z.string()')
    })
    it.concurrent('zod: string with format date-time', () => {
      expect(schemaToInlineExpression({ type: 'string', format: 'date-time' }, 'zod')).toBe(
        'z.string()',
      )
    })
    it.concurrent('zod: string with format uri', () => {
      expect(schemaToInlineExpression({ type: 'string', format: 'uri' }, 'zod')).toBe('z.string()')
    })
    it.concurrent('valibot: string with format email', () => {
      expect(schemaToInlineExpression({ type: 'string', format: 'email' }, 'valibot')).toBe(
        'v.string()',
      )
    })
    it.concurrent('typebox: string with format uuid', () => {
      expect(schemaToInlineExpression({ type: 'string', format: 'uuid' }, 'typebox')).toBe(
        'Type.String()',
      )
    })
    it.concurrent('arktype: string with format date-time', () => {
      expect(schemaToInlineExpression({ type: 'string', format: 'date-time' }, 'arktype')).toBe(
        "type('string')",
      )
    })
    it.concurrent('effect: string with format uri', () => {
      expect(schemaToInlineExpression({ type: 'string', format: 'uri' }, 'effect')).toBe(
        'Schema.String',
      )
    })
  })

  // --- 8. $ref (should return the ref as resolved name) ---
  describe('$ref resolution', () => {
    it.concurrent('zod: $ref resolves to schema name', () => {
      expect(schemaToInlineExpression({ $ref: '#/components/schemas/Pet' }, 'zod')).toBe(
        'PetSchema',
      )
    })
    it.concurrent('valibot: $ref resolves to schema name', () => {
      expect(schemaToInlineExpression({ $ref: '#/components/schemas/Order' }, 'valibot')).toBe(
        'OrderSchema',
      )
    })
    it.concurrent('typebox: $ref resolves to schema name', () => {
      expect(schemaToInlineExpression({ $ref: '#/components/schemas/Item' }, 'typebox')).toBe(
        'ItemSchema',
      )
    })
    it.concurrent('arktype: $ref resolves to schema name', () => {
      expect(schemaToInlineExpression({ $ref: '#/components/schemas/Config' }, 'arktype')).toBe(
        'ConfigSchema',
      )
    })
    it.concurrent('effect: $ref resolves to schema name', () => {
      expect(schemaToInlineExpression({ $ref: '#/components/schemas/Event' }, 'effect')).toBe(
        'EventSchema',
      )
    })
    it.concurrent('$ref with nested path resolves correctly', () => {
      expect(schemaToInlineExpression({ $ref: '#/components/schemas/CreateUser' }, 'zod')).toBe(
        'CreateUserSchema',
      )
    })
  })

  // --- 9. prefixItems (tuple validation) ---
  describe('prefixItems (tuple)', () => {
    // prefixItems is not currently handled by the implementation,
    // so arrays with prefixItems but no items fall through to default behavior.
    it.concurrent('zod: array with prefixItems falls back to array type', () => {
      const schema: Schema = {
        type: 'array',
        prefixItems: [{ type: 'string' }, { type: 'number' }],
      }
      // No items defined, so singleItems returns undefined -> z.array(z.unknown())
      expect(schemaToInlineExpression(schema, 'zod')).toBe('z.array(z.unknown())')
    })
    it.concurrent('valibot: array with prefixItems falls back', () => {
      const schema: Schema = {
        type: 'array',
        prefixItems: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe('v.array(v.unknown())')
    })
    it.concurrent('typebox: array with prefixItems falls back', () => {
      const schema: Schema = {
        type: 'array',
        prefixItems: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe('Type.Array(Type.Unknown())')
    })
    it.concurrent('arktype: array with prefixItems falls back', () => {
      const schema: Schema = {
        type: 'array',
        prefixItems: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('unknown[]')")
    })
    it.concurrent('effect: array with prefixItems falls back', () => {
      const schema: Schema = {
        type: 'array',
        prefixItems: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'effect')).toBe('Schema.Array(Schema.Unknown)')
    })
  })

  // --- 10. const value ---
  describe('const value', () => {
    // const is not currently handled by the implementation,
    // so schemas with only const fall through to the default/unknown case.
    it.concurrent('zod: schema with const falls to unknown', () => {
      const schema: Schema = { const: 'fixed' }
      expect(schemaToInlineExpression(schema, 'zod')).toBe('z.unknown()')
    })
    it.concurrent('valibot: schema with const falls to unknown', () => {
      const schema: Schema = { const: 42 }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe('v.unknown()')
    })
    it.concurrent('typebox: schema with const falls to unknown', () => {
      const schema: Schema = { const: true }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe('Type.Unknown()')
    })
    it.concurrent('arktype: schema with const falls to unknown', () => {
      const schema: Schema = { const: 'fixed' }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('unknown')")
    })
    it.concurrent('effect: schema with const falls to unknown', () => {
      const schema: Schema = { const: 'fixed' }
      expect(schemaToInlineExpression(schema, 'effect')).toBe('Schema.Unknown')
    })
  })

  // --- 11. anyOf for each library ---
  describe('anyOf for each library', () => {
    it.concurrent('valibot: anyOf with inline types', () => {
      const schema: Schema = {
        anyOf: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe('v.union([v.string(),v.number()])')
    })
    it.concurrent('typebox: anyOf with inline types', () => {
      const schema: Schema = {
        anyOf: [{ type: 'string' }, { type: 'boolean' }],
      }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe(
        'Type.Union([Type.String(),Type.Boolean()])',
      )
    })
    it.concurrent('arktype: anyOf with inline types', () => {
      const schema: Schema = {
        anyOf: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('string | number')")
    })
    it.concurrent('effect: anyOf with inline types', () => {
      const schema: Schema = {
        anyOf: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'effect')).toBe(
        'Schema.Union(Schema.String,Schema.Number)',
      )
    })
    it.concurrent('single anyOf returns expression directly', () => {
      const schema: Schema = {
        anyOf: [{ type: 'boolean' }],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe('z.boolean()')
    })
  })

  // --- 12. Array type with null (OpenAPI 3.1 nullable) ---
  describe('type array with null (OpenAPI 3.1 nullable)', () => {
    it.concurrent('valibot: type ["string", "null"] produces nullable string', () => {
      const schema: Schema = { type: ['string', 'null'] }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe('v.nullable(v.string())')
    })
    it.concurrent('typebox: type ["string", "null"] produces nullable string', () => {
      const schema: Schema = { type: ['string', 'null'] }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe(
        'Type.Union([Type.String(),Type.Null()])',
      )
    })
    it.concurrent('arktype: type ["string", "null"] produces nullable string', () => {
      const schema: Schema = { type: ['string', 'null'] }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('string | null')")
    })
    it.concurrent('effect: type ["string", "null"] produces nullable string', () => {
      const schema: Schema = { type: ['string', 'null'] }
      expect(schemaToInlineExpression(schema, 'effect')).toBe('Schema.NullOr(Schema.String)')
    })
    it.concurrent('valibot: type ["number", "null"] produces nullable number', () => {
      const schema: Schema = { type: ['number', 'null'] }
      expect(schemaToInlineExpression(schema, 'valibot')).toBe('v.nullable(v.number())')
    })
    it.concurrent('typebox: type ["integer", "null"] produces nullable integer', () => {
      const schema: Schema = { type: ['integer', 'null'] }
      expect(schemaToInlineExpression(schema, 'typebox')).toBe(
        'Type.Union([Type.Integer(),Type.Null()])',
      )
    })
    it.concurrent('arktype: type ["boolean", "null"] produces nullable boolean', () => {
      const schema: Schema = { type: ['boolean', 'null'] }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('boolean | null')")
    })
    it.concurrent('effect: type ["boolean", "null"] produces nullable boolean', () => {
      const schema: Schema = { type: ['boolean', 'null'] }
      expect(schemaToInlineExpression(schema, 'effect')).toBe('Schema.NullOr(Schema.Boolean)')
    })
  })

  // --- 13. Empty object schema (no properties) ---
  describe('empty object schema', () => {
    it.concurrent('zod: empty object', () => {
      expect(schemaToInlineExpression({ type: 'object' }, 'zod')).toBe('z.object({})')
    })
    it.concurrent('valibot: empty object', () => {
      expect(schemaToInlineExpression({ type: 'object' }, 'valibot')).toBe('v.object({})')
    })
    it.concurrent('typebox: empty object', () => {
      expect(schemaToInlineExpression({ type: 'object' }, 'typebox')).toBe('Type.Object({})')
    })
    it.concurrent('arktype: empty object', () => {
      expect(schemaToInlineExpression({ type: 'object' }, 'arktype')).toBe('type({})')
    })
    it.concurrent('effect: empty object', () => {
      expect(schemaToInlineExpression({ type: 'object' }, 'effect')).toBe('Schema.Struct({})')
    })
  })

  // --- 14. Schema properties that are ignored by inline generation ---
  describe('schema with ignored properties (readOnly, writeOnly, default, pattern, minLength, maxLength, minimum, maximum)', () => {
    it.concurrent('zod: readOnly property is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', readOnly: true }, 'zod')).toBe('z.string()')
    })
    it.concurrent('valibot: readOnly property is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', readOnly: true }, 'valibot')).toBe(
        'v.string()',
      )
    })
    it.concurrent('typebox: readOnly property is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', readOnly: true }, 'typebox')).toBe(
        'Type.String()',
      )
    })
    it.concurrent('arktype: readOnly property is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', readOnly: true }, 'arktype')).toBe(
        "type('string')",
      )
    })
    it.concurrent('effect: readOnly property is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', readOnly: true }, 'effect')).toBe(
        'Schema.String',
      )
    })
    it.concurrent('zod: writeOnly property is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', writeOnly: true }, 'zod')).toBe(
        'z.string()',
      )
    })
    it.concurrent('valibot: writeOnly property is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', writeOnly: true }, 'valibot')).toBe(
        'v.string()',
      )
    })
    it.concurrent('typebox: writeOnly property is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', writeOnly: true }, 'typebox')).toBe(
        'Type.String()',
      )
    })
    it.concurrent('arktype: writeOnly property is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', writeOnly: true }, 'arktype')).toBe(
        "type('string')",
      )
    })
    it.concurrent('effect: writeOnly property is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', writeOnly: true }, 'effect')).toBe(
        'Schema.String',
      )
    })
    it.concurrent('zod: default value is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', default: 'hello' }, 'zod')).toBe(
        'z.string()',
      )
    })
    it.concurrent('valibot: default value is ignored', () => {
      expect(schemaToInlineExpression({ type: 'number', default: 42 }, 'valibot')).toBe(
        'v.number()',
      )
    })
    it.concurrent('typebox: default value is ignored', () => {
      expect(schemaToInlineExpression({ type: 'boolean', default: true }, 'typebox')).toBe(
        'Type.Boolean()',
      )
    })
    it.concurrent('arktype: default value is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', default: 'test' }, 'arktype')).toBe(
        "type('string')",
      )
    })
    it.concurrent('effect: default value is ignored', () => {
      expect(schemaToInlineExpression({ type: 'integer', default: 0 }, 'effect')).toBe(
        'Schema.Number',
      )
    })
    it.concurrent('zod: minLength/maxLength are ignored', () => {
      expect(
        schemaToInlineExpression({ type: 'string', minLength: 1, maxLength: 100 }, 'zod'),
      ).toBe('z.string()')
    })
    it.concurrent('valibot: minLength/maxLength are ignored', () => {
      expect(
        schemaToInlineExpression({ type: 'string', minLength: 1, maxLength: 100 }, 'valibot'),
      ).toBe('v.string()')
    })
    it.concurrent('typebox: minLength/maxLength are ignored', () => {
      expect(
        schemaToInlineExpression({ type: 'string', minLength: 1, maxLength: 100 }, 'typebox'),
      ).toBe('Type.String()')
    })
    it.concurrent('arktype: minLength/maxLength are ignored', () => {
      expect(
        schemaToInlineExpression({ type: 'string', minLength: 1, maxLength: 100 }, 'arktype'),
      ).toBe("type('string')")
    })
    it.concurrent('effect: minLength/maxLength are ignored', () => {
      expect(
        schemaToInlineExpression({ type: 'string', minLength: 1, maxLength: 100 }, 'effect'),
      ).toBe('Schema.String')
    })
    it.concurrent('zod: minimum/maximum are ignored', () => {
      expect(schemaToInlineExpression({ type: 'number', minimum: 0, maximum: 100 }, 'zod')).toBe(
        'z.number()',
      )
    })
    it.concurrent('valibot: minimum/maximum are ignored', () => {
      expect(
        schemaToInlineExpression({ type: 'number', minimum: 0, maximum: 100 }, 'valibot'),
      ).toBe('v.number()')
    })
    it.concurrent('typebox: minimum/maximum are ignored', () => {
      expect(
        schemaToInlineExpression({ type: 'integer', minimum: 0, maximum: 100 }, 'typebox'),
      ).toBe('Type.Integer()')
    })
    it.concurrent('arktype: minimum/maximum are ignored', () => {
      expect(
        schemaToInlineExpression({ type: 'number', minimum: 0, maximum: 100 }, 'arktype'),
      ).toBe("type('number')")
    })
    it.concurrent('effect: minimum/maximum are ignored', () => {
      expect(schemaToInlineExpression({ type: 'number', minimum: 0, maximum: 100 }, 'effect')).toBe(
        'Schema.Number',
      )
    })
    it.concurrent('zod: pattern is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', pattern: '^[a-z]+$' }, 'zod')).toBe(
        'z.string()',
      )
    })
    it.concurrent('valibot: pattern is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', pattern: '^[a-z]+$' }, 'valibot')).toBe(
        'v.string()',
      )
    })
    it.concurrent('typebox: pattern is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', pattern: '^[a-z]+$' }, 'typebox')).toBe(
        'Type.String()',
      )
    })
    it.concurrent('arktype: pattern is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', pattern: '^[a-z]+$' }, 'arktype')).toBe(
        "type('string')",
      )
    })
    it.concurrent('effect: pattern is ignored', () => {
      expect(schemaToInlineExpression({ type: 'string', pattern: '^[a-z]+$' }, 'effect')).toBe(
        'Schema.String',
      )
    })
  })

  // --- arktype: object-form in array, union, allOf, nullable ---
  describe('arktype: object-form composition', () => {
    it.concurrent('arktype: array of object uses .array()', () => {
      const schema: Schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe('type({\'name\':"string"}).array()')
    })

    it.concurrent('arktype: array of string stays type(...[])', () => {
      const schema: Schema = { type: 'array', items: { type: 'string' } }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('string[]')")
    })

    it.concurrent('arktype: oneOf with object-form uses .or()', () => {
      const schema: Schema = {
        oneOf: [
          {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name'],
          },
          {
            type: 'object',
            properties: { code: { type: 'integer' } },
            required: ['code'],
          },
        ],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe(
        'type({\'name\':"string"}).or(type({\'code\':"number"}))',
      )
    })

    it.concurrent('arktype: oneOf with string-form stays type(... | ...)', () => {
      const schema: Schema = {
        oneOf: [{ type: 'string' }, { type: 'number' }],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe("type('string | number')")
    })

    it.concurrent('arktype: allOf with object-form uses .and()', () => {
      const schema: Schema = {
        allOf: [
          {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name'],
          },
          {
            type: 'object',
            properties: { age: { type: 'integer' } },
            required: ['age'],
          },
        ],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe(
        'type({\'name\':"string"}).and(type({\'age\':"number"}))',
      )
    })

    it.concurrent('arktype: nullable object uses .or(null)', () => {
      const schema: Schema = {
        type: 'object',
        nullable: true,
        properties: { name: { type: 'string' } },
        required: ['name'],
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe(
        "type({'name':\"string\"}).or('null')",
      )
    })

    it.concurrent('arktype: array of enum object uses .array()', () => {
      const schema: Schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
          required: ['status'],
        },
      }
      expect(schemaToInlineExpression(schema, 'arktype')).toBe(
        'type({\'status\':"\\\"active\\\" | \\\"inactive\\\""}).array()',
      )
    })
  })

  describe('meta-aware inline schemas (delegated to schema-to-library)', () => {
    // When the inline schema has any of description / example / examples /
    // deprecated, schemaToInlineExpression delegates to schema-to-library so
    // each library gets its idiomatic meta encoding. Lazy/suspend wrappers
    // around nested $refs are unwrapped because inline schemas live next to
    // their referenced ones in the same generated file.

    const userSchema: Schema = {
      type: 'object',
      description: 'A user',
      properties: { id: { type: 'integer' }, name: { type: 'string' } },
      required: ['id', 'name'],
    }

    it.concurrent('zod: description only → .meta({description})', () => {
      expect(schemaToInlineExpression(userSchema, 'zod')).toBe(
        'z.object({id:z.int(),name:z.string()}).meta({description:"A user"})',
      )
    })

    it.concurrent('valibot: description only → v.pipe(...,v.description)', () => {
      expect(schemaToInlineExpression(userSchema, 'valibot')).toBe(
        'v.pipe(v.object({id:v.pipe(v.number(),v.integer()),name:v.string()}),v.description("A user"))',
      )
    })

    it.concurrent('typebox: description only → Type.Object(...,{description})', () => {
      expect(schemaToInlineExpression(userSchema, 'typebox')).toBe(
        'Type.Object({id:Type.Integer(),name:Type.String()},{description:"A user"})',
      )
    })

    it.concurrent('arktype: description only → .describe()', () => {
      expect(schemaToInlineExpression(userSchema, 'arktype')).toBe(
        'type({id:"number.integer",name:"string"}).describe("A user")',
      )
    })

    it.concurrent('effect: description only → .annotations({description})', () => {
      expect(schemaToInlineExpression(userSchema, 'effect')).toBe(
        'Schema.Struct({id:Schema.Number.pipe(Schema.int()),name:Schema.String}).annotations({description:"A user"})',
      )
    })

    const userWithExample: Schema = {
      type: 'object',
      description: 'A user',
      example: { id: 1, name: 'Alice' },
      properties: { id: { type: 'integer' }, name: { type: 'string' } },
      required: ['id', 'name'],
    }

    it.concurrent('zod: description + example → meta({description,examples:[example]})', () => {
      expect(schemaToInlineExpression(userWithExample, 'zod')).toBe(
        'z.object({id:z.int(),name:z.string()}).meta({description:"A user",examples:[{id:1,name:"Alice"}]})',
      )
    })

    it.concurrent('valibot: description + example → pipe + v.metadata({examples})', () => {
      expect(schemaToInlineExpression(userWithExample, 'valibot')).toBe(
        'v.pipe(v.object({id:v.pipe(v.number(),v.integer()),name:v.string()}),v.description("A user"),v.metadata({examples:[{id:1,name:"Alice"}]}))',
      )
    })

    it.concurrent('typebox: description + example → constructor opts {description,examples}', () => {
      expect(schemaToInlineExpression(userWithExample, 'typebox')).toBe(
        'Type.Object({id:Type.Integer(),name:Type.String()},{description:"A user",examples:[{id:1,name:"Alice"}]})',
      )
    })

    it.concurrent('arktype: example is ignored — only .describe() emitted', () => {
      // arktype has no equivalent for examples; schema-to-library only emits .describe().
      expect(schemaToInlineExpression(userWithExample, 'arktype')).toBe(
        'type({id:"number.integer",name:"string"}).describe("A user")',
      )
    })

    it.concurrent('effect: description + example → .annotations({description,examples})', () => {
      expect(schemaToInlineExpression(userWithExample, 'effect')).toBe(
        'Schema.Struct({id:Schema.Number.pipe(Schema.int()),name:Schema.String}).annotations({description:"A user",examples:[{id:1,name:"Alice"}]})',
      )
    })

    const deprecatedSchema: Schema = {
      type: 'object',
      deprecated: true,
      properties: { id: { type: 'integer' } },
      required: ['id'],
    }

    it.concurrent('zod: deprecated → .meta({deprecated:true})', () => {
      expect(schemaToInlineExpression(deprecatedSchema, 'zod')).toBe(
        'z.object({id:z.int()}).meta({deprecated:true})',
      )
    })

    it.concurrent('valibot: deprecated → v.pipe(...,v.metadata({deprecated:true}))', () => {
      expect(schemaToInlineExpression(deprecatedSchema, 'valibot')).toBe(
        'v.pipe(v.object({id:v.pipe(v.number(),v.integer())}),v.metadata({deprecated:true}))',
      )
    })

    it.concurrent('typebox: deprecated → Type.Object(...,{deprecated:true})', () => {
      expect(schemaToInlineExpression(deprecatedSchema, 'typebox')).toBe(
        'Type.Object({id:Type.Integer()},{deprecated:true})',
      )
    })

    it.concurrent('effect: deprecated nests under jsonSchema annotation', () => {
      expect(schemaToInlineExpression(deprecatedSchema, 'effect')).toBe(
        'Schema.Struct({id:Schema.Number.pipe(Schema.int())}).annotations({jsonSchema:{deprecated:true}})',
      )
    })

    const wrapperWithRef: Schema = {
      type: 'object',
      description: 'A wrapper',
      properties: { user: { $ref: '#/components/schemas/User' } },
      required: ['user'],
    }

    it.concurrent('zod: nested $ref is unwrapped from z.lazy(() => UserSchema)', () => {
      expect(schemaToInlineExpression(wrapperWithRef, 'zod')).toBe(
        'z.object({user:UserSchema}).meta({description:"A wrapper"})',
      )
    })

    it.concurrent('valibot: nested $ref is unwrapped from v.lazy(() => UserSchema)', () => {
      expect(schemaToInlineExpression(wrapperWithRef, 'valibot')).toBe(
        'v.pipe(v.object({user:UserSchema}),v.description("A wrapper"))',
      )
    })

    it.concurrent('effect: nested $ref is unwrapped from Schema.suspend(() => UserSchema)', () => {
      expect(schemaToInlineExpression(wrapperWithRef, 'effect')).toBe(
        'Schema.Struct({user:UserSchema}).annotations({description:"A wrapper"})',
      )
    })

    it.concurrent('typebox: nested $ref already bare (no unwrap needed)', () => {
      expect(schemaToInlineExpression(wrapperWithRef, 'typebox')).toBe(
        'Type.Object({user:UserSchema},{description:"A wrapper"})',
      )
    })

    it.concurrent('top-level $ref returns bare reference (meta lives on referenced schema)', () => {
      const ref: Schema = { $ref: '#/components/schemas/User' }
      expect(schemaToInlineExpression(ref, 'zod')).toBe('UserSchema')
      expect(schemaToInlineExpression(ref, 'valibot')).toBe('UserSchema')
      expect(schemaToInlineExpression(ref, 'typebox')).toBe('UserSchema')
      expect(schemaToInlineExpression(ref, 'arktype')).toBe('UserSchema')
      expect(schemaToInlineExpression(ref, 'effect')).toBe('UserSchema')
    })

    it.concurrent('zod: integer constraints are preserved on meta path (regression vs non-meta path)', () => {
      // The non-meta hand-written path drops min/max for integer; the meta
      // path delegates to schema-to-library which keeps them.
      const schema: Schema = {
        type: 'object',
        description: 'D',
        properties: { age: { type: 'integer', minimum: 0, maximum: 120 } },
        required: ['age'],
      }
      expect(schemaToInlineExpression(schema, 'zod')).toBe(
        'z.object({age:z.int().min(0).max(120)}).meta({description:"D"})',
      )
    })
  })
})
