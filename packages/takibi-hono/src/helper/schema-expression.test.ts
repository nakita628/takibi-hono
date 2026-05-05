import { describe, expect, it } from 'vite-plus/test'

import { extractSchemaExports } from './schema-expression.js'

describe('extractSchemaExports', () => {
  // --- zod ---
  it.concurrent('zod: basic schema with fixed type name', () => {
    const result = extractSchemaExports(
      'User',
      {
        type: 'object',
        properties: { name: { type: 'string' }, age: { type: 'integer' } },
        required: ['name'],
      },
      'zod',
    )
    expect(result).toBe(
      'export const UserSchema = z.object({name:z.string(),age:z.int().optional()})\n\nexport type User = z.infer<typeof UserSchema>',
    )
  })

  it.concurrent('zod: .describe() when description exists', () => {
    const result = extractSchemaExports(
      'Pet',
      {
        type: 'object',
        description: 'A pet object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      'zod',
    )
    expect(result).toBe(
      'export const PetSchema = z.object({name:z.string()}).meta({description:"A pet object"})\n\nexport type Pet = z.infer<typeof PetSchema>',
    )
  })

  it.concurrent('zod: $ref schemas', () => {
    const result = extractSchemaExports(
      'Todo',
      {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user: { $ref: '#/components/schemas/User' },
        },
        required: ['id'],
      },
      'zod',
    )
    expect(result).toBe(
      'export const TodoSchema = z.object({id:z.int(),user:z.lazy(() => UserSchema).optional()})\n\nexport type Todo = z.infer<typeof TodoSchema>',
    )
  })

  // --- valibot ---
  it.concurrent('valibot: basic schema with fixed type names', () => {
    const result = extractSchemaExports(
      'User',
      {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      'valibot',
    )
    expect(result).toBe(
      'export const UserSchema = v.object({name:v.string()})\n\nexport type User = v.InferOutput<typeof UserSchema>',
    )
  })

  it.concurrent('valibot: v.pipe with v.description and v.examples', () => {
    const result = extractSchemaExports(
      'Pet',
      {
        type: 'object',
        description: 'A pet',
        example: { name: 'Buddy' },
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      'valibot',
    )
    expect(result).toBe(
      'export const PetSchema = v.pipe(v.object({name:v.string()}),v.description("A pet"),v.metadata({examples:[{name:"Buddy"}]}))\n\nexport type Pet = v.InferOutput<typeof PetSchema>',
    )
  })

  // --- arktype ---
  it.concurrent('arktype: .describe() when description exists', () => {
    const result = extractSchemaExports(
      'Pet',
      {
        type: 'object',
        description: 'A pet',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      'arktype',
    )
    expect(result).toBe(
      'export const PetSchema = type({name:"string"}).describe("A pet")\n\nexport type Pet = typeof PetSchema.infer',
    )
  })

  // --- typebox ---
  it.concurrent('typebox: constructor options when description exists', () => {
    const result = extractSchemaExports(
      'Pet',
      {
        type: 'object',
        description: 'A pet',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      'typebox',
    )
    expect(result).toBe(
      'export const PetSchema = Type.Object({name:Type.String()},{description:"A pet"})\n\nexport type Pet = Static<typeof PetSchema>',
    )
  })

  it.concurrent('typebox: constructor options with description and example', () => {
    const result = extractSchemaExports(
      'Pet',
      {
        type: 'object',
        description: 'A pet',
        example: { name: 'Buddy' },
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      'typebox',
    )
    expect(result).toBe(
      'export const PetSchema = Type.Object({name:Type.String()},{description:"A pet",examples:[{name:"Buddy"}]})\n\nexport type Pet = Static<typeof PetSchema>',
    )
  })

  // --- effect ---
  it.concurrent('effect: .annotations() when description and example exist', () => {
    const result = extractSchemaExports(
      'Pet',
      {
        type: 'object',
        description: 'A pet',
        example: { name: 'Buddy' },
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      'effect',
    )
    expect(result).toBe(
      'export const PetSchema = Schema.Struct({name:Schema.String}).annotations({description:"A pet",examples:[{name:"Buddy"}]})\n\nexport type Pet = typeof PetSchema.Encoded',
    )
  })
})

// ===================================================================
// 1. extractSchemaExports — simple object for each schema library
// ===================================================================
describe('extractSchemaExports: simple object per library', () => {
  const schema = {
    type: 'object' as const,
    properties: { name: { type: 'string' as const } },
    required: ['name'],
  }

  it.concurrent('zod: simple object', () => {
    const result = extractSchemaExports('Item', schema, 'zod')
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string()})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: simple object', () => {
    const result = extractSchemaExports('Item', schema, 'valibot')
    expect(result).toBe(
      'export const ItemSchema = v.object({name:v.string()})\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: simple object', () => {
    const result = extractSchemaExports('Item', schema, 'typebox')
    expect(result).toBe(
      'export const ItemSchema = Type.Object({name:Type.String()})\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: simple object', () => {
    const result = extractSchemaExports('Item', schema, 'arktype')
    expect(result).toBe(
      'export const ItemSchema = type({name:"string"})\n\nexport type Item = typeof ItemSchema.infer',
    )
  })

  it.concurrent('effect: simple object', () => {
    const result = extractSchemaExports('Item', schema, 'effect')
    expect(result).toBe(
      'export const ItemSchema = Schema.Struct({name:Schema.String})\n\nexport type Item = typeof ItemSchema.Encoded',
    )
  })
})

// ===================================================================
// 2. extractSchemaExports — exportType: false
// ===================================================================
describe('extractSchemaExports: exportType false', () => {
  const schema = {
    type: 'object' as const,
    properties: { name: { type: 'string' as const } },
    required: ['name'],
  }

  it.concurrent('zod: exportType false', () => {
    const result = extractSchemaExports('Item', schema, 'zod', false)
    expect(result).toBe('export const ItemSchema = z.object({name:z.string()})')
  })

  it.concurrent('valibot: exportType false', () => {
    const result = extractSchemaExports('Item', schema, 'valibot', false)
    expect(result).toBe('export const ItemSchema = v.object({name:v.string()})')
  })

  it.concurrent('typebox: exportType false', () => {
    const result = extractSchemaExports('Item', schema, 'typebox', false)
    expect(result).toBe('export const ItemSchema = Type.Object({name:Type.String()})')
  })

  it.concurrent('arktype: exportType false', () => {
    const result = extractSchemaExports('Item', schema, 'arktype', false)
    expect(result).toBe('export const ItemSchema = type({name:"string"})')
  })

  it.concurrent('effect: exportType false', () => {
    const result = extractSchemaExports('Item', schema, 'effect', false)
    expect(result).toBe('export const ItemSchema = Schema.Struct({name:Schema.String})')
  })
})

// ===================================================================
// 3. extractSchemaExports — description metadata per library
// ===================================================================
describe('extractSchemaExports: description metadata', () => {
  const schema = {
    type: 'object' as const,
    description: 'An item',
    properties: { name: { type: 'string' as const } },
    required: ['name'],
  }

  it.concurrent('zod: description', () => {
    const result = extractSchemaExports('Item', schema, 'zod')
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string()}).meta({description:"An item"})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: description', () => {
    const result = extractSchemaExports('Item', schema, 'valibot')
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.object({name:v.string()}),v.description("An item"))\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: description', () => {
    const result = extractSchemaExports('Item', schema, 'typebox')
    expect(result).toBe(
      'export const ItemSchema = Type.Object({name:Type.String()},{description:"An item"})\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: description', () => {
    const result = extractSchemaExports('Item', schema, 'arktype')
    expect(result).toBe(
      'export const ItemSchema = type({name:"string"}).describe("An item")\n\nexport type Item = typeof ItemSchema.infer',
    )
  })

  it.concurrent('effect: description', () => {
    const result = extractSchemaExports('Item', schema, 'effect')
    expect(result).toBe(
      'export const ItemSchema = Schema.Struct({name:Schema.String}).annotations({description:"An item"})\n\nexport type Item = typeof ItemSchema.Encoded',
    )
  })
})

// ===================================================================
// 4. extractSchemaExports — example metadata for valibot and effect
// ===================================================================
describe('extractSchemaExports: example metadata', () => {
  it.concurrent('valibot: example only (no description)', () => {
    const result = extractSchemaExports(
      'Item',
      {
        type: 'object',
        example: { name: 'test' },
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      'valibot',
    )
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.object({name:v.string()}),v.metadata({examples:[{name:"test"}]}))\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('effect: example only (no description)', () => {
    const result = extractSchemaExports(
      'Item',
      {
        type: 'object',
        example: { name: 'test' },
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
      'effect',
    )
    expect(result).toBe(
      'export const ItemSchema = Schema.Struct({name:Schema.String}).annotations({examples:[{name:"test"}]})\n\nexport type Item = typeof ItemSchema.Encoded',
    )
  })
})

// ===================================================================
// 5. postProcess / fixMultiArgCall — allOf with 3+ items
// ===================================================================
describe('extractSchemaExports: allOf nesting (fixMultiArgCall)', () => {
  const allOf3Schema = {
    allOf: [
      { type: 'object' as const, properties: { a: { type: 'string' as const } }, required: ['a'] },
      { type: 'object' as const, properties: { b: { type: 'string' as const } }, required: ['b'] },
      { type: 'object' as const, properties: { c: { type: 'string' as const } }, required: ['c'] },
    ],
  }

  it.concurrent('zod: allOf 3 items — z.intersection nesting', () => {
    const result = extractSchemaExports('Combined', allOf3Schema as any, 'zod')
    expect(result).toBe(
      'export const CombinedSchema = z.intersection(z.intersection(z.object({a:z.string()}),z.object({b:z.string()})),z.object({c:z.string()}))\n\nexport type Combined = z.infer<typeof CombinedSchema>',
    )
  })

  it.concurrent('effect: allOf 3 items — Schema.extend nesting', () => {
    const result = extractSchemaExports('Combined', allOf3Schema as any, 'effect')
    expect(result).toBe(
      'export const CombinedSchema = Schema.extend(Schema.extend(Schema.Struct({a:Schema.String}),Schema.Struct({b:Schema.String})),Schema.Struct({c:Schema.String}))\n\nexport type Combined = typeof CombinedSchema.Encoded',
    )
  })

  it.concurrent('valibot: allOf 3 items — no nesting (uses array)', () => {
    const result = extractSchemaExports('Combined', allOf3Schema as any, 'valibot')
    expect(result).toBe(
      'export const CombinedSchema = v.intersect([v.object({a:v.string()}),v.object({b:v.string()}),v.object({c:v.string()})])\n\nexport type Combined = v.InferOutput<typeof CombinedSchema>',
    )
  })

  it.concurrent('typebox: allOf 3 items — no nesting (uses array)', () => {
    const result = extractSchemaExports('Combined', allOf3Schema as any, 'typebox')
    expect(result).toBe(
      'export const CombinedSchema = Type.Intersect([Type.Object({a:Type.String()}),Type.Object({b:Type.String()}),Type.Object({c:Type.String()})])\n\nexport type Combined = Static<typeof CombinedSchema>',
    )
  })

  it.concurrent('arktype: allOf 3 items — chained .and()', () => {
    const result = extractSchemaExports('Combined', allOf3Schema as any, 'arktype')
    expect(result).toBe(
      'export const CombinedSchema = type(type(type({a:"string"})).and(type({b:"string"}))).and(type({c:"string"}))\n\nexport type Combined = typeof CombinedSchema.infer',
    )
  })

  const allOf4Schema = {
    allOf: [
      { type: 'object' as const, properties: { a: { type: 'string' as const } }, required: ['a'] },
      { type: 'object' as const, properties: { b: { type: 'string' as const } }, required: ['b'] },
      { type: 'object' as const, properties: { c: { type: 'string' as const } }, required: ['c'] },
      { type: 'object' as const, properties: { d: { type: 'string' as const } }, required: ['d'] },
    ],
  }

  it.concurrent('zod: allOf 4 items — deep z.intersection nesting', () => {
    const result = extractSchemaExports('Merged', allOf4Schema as any, 'zod')
    expect(result).toBe(
      'export const MergedSchema = z.intersection(z.intersection(z.intersection(z.object({a:z.string()}),z.object({b:z.string()})),z.object({c:z.string()})),z.object({d:z.string()}))\n\nexport type Merged = z.infer<typeof MergedSchema>',
    )
  })

  it.concurrent('effect: allOf 4 items — deep Schema.extend nesting', () => {
    const result = extractSchemaExports('Merged', allOf4Schema as any, 'effect')
    expect(result).toBe(
      'export const MergedSchema = Schema.extend(Schema.extend(Schema.extend(Schema.Struct({a:Schema.String}),Schema.Struct({b:Schema.String})),Schema.Struct({c:Schema.String})),Schema.Struct({d:Schema.String}))\n\nexport type Merged = typeof MergedSchema.Encoded',
    )
  })
})

// ===================================================================
// 6. appendMeta behavior per library — description + example combined
// ===================================================================
describe('extractSchemaExports: appendMeta with description and example', () => {
  const schema = {
    type: 'object' as const,
    description: 'An item',
    example: { name: 'test' },
    properties: { name: { type: 'string' as const } },
    required: ['name'],
  }

  it.concurrent('zod: meta with description and examples', () => {
    const result = extractSchemaExports('Item', schema, 'zod')
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string()}).meta({description:"An item",examples:[{name:"test"}]})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: v.pipe with description and examples', () => {
    const result = extractSchemaExports('Item', schema, 'valibot')
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.object({name:v.string()}),v.description("An item"),v.metadata({examples:[{name:"test"}]}))\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: constructor options with description and examples', () => {
    const result = extractSchemaExports('Item', schema, 'typebox')
    expect(result).toBe(
      'export const ItemSchema = Type.Object({name:Type.String()},{description:"An item",examples:[{name:"test"}]})\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: description only (example ignored)', () => {
    const result = extractSchemaExports('Item', schema, 'arktype')
    expect(result).toBe(
      'export const ItemSchema = type({name:"string"}).describe("An item")\n\nexport type Item = typeof ItemSchema.infer',
    )
  })

  it.concurrent('effect: annotations with description and examples', () => {
    const result = extractSchemaExports('Item', schema, 'effect')
    expect(result).toBe(
      'export const ItemSchema = Schema.Struct({name:Schema.String}).annotations({description:"An item",examples:[{name:"test"}]})\n\nexport type Item = typeof ItemSchema.Encoded',
    )
  })
})

// ===================================================================
// 7. extractSchemaExports — oneOf schema per library
// ===================================================================
describe('extractSchemaExports: oneOf schema', () => {
  const schema = {
    oneOf: [{ type: 'string' as const }, { type: 'integer' as const }],
  }

  it.concurrent('zod: oneOf without discriminator — z.xor', () => {
    const result = extractSchemaExports('Shape', schema as any, 'zod')
    expect(result).toBe(
      'export const ShapeSchema = z.xor([z.string(),z.int()])\n\nexport type Shape = z.infer<typeof ShapeSchema>',
    )
  })

  it.concurrent('valibot: oneOf — v.union', () => {
    const result = extractSchemaExports('Shape', schema as any, 'valibot')
    expect(result).toBe(
      'export const ShapeSchema = v.union([v.string(),v.pipe(v.number(),v.integer())])\n\nexport type Shape = v.InferOutput<typeof ShapeSchema>',
    )
  })

  it.concurrent('typebox: oneOf — Type.Union', () => {
    const result = extractSchemaExports('Shape', schema as any, 'typebox')
    expect(result).toBe(
      'export const ShapeSchema = Type.Union([Type.String(),Type.Integer()])\n\nexport type Shape = Static<typeof ShapeSchema>',
    )
  })

  it.concurrent('arktype: oneOf — union', () => {
    const result = extractSchemaExports('Shape', schema as any, 'arktype')
    expect(result).toBe(
      'export const ShapeSchema = type("string | number.integer")\n\nexport type Shape = typeof ShapeSchema.infer',
    )
  })

  it.concurrent('effect: oneOf — Schema.Union', () => {
    const result = extractSchemaExports('Shape', schema as any, 'effect')
    expect(result).toBe(
      'export const ShapeSchema = Schema.Union(Schema.String,Schema.Number.pipe(Schema.int()))\n\nexport type Shape = typeof ShapeSchema.Encoded',
    )
  })
})

// ===================================================================
// 8. extractSchemaExports — anyOf schema per library
// ===================================================================
describe('extractSchemaExports: anyOf schema', () => {
  const schema = {
    anyOf: [{ type: 'number' as const }, { type: 'boolean' as const }],
  }

  it.concurrent('zod: anyOf — z.union', () => {
    const result = extractSchemaExports('Shape', schema as any, 'zod')
    expect(result).toBe(
      'export const ShapeSchema = z.union([z.number(),z.boolean()])\n\nexport type Shape = z.infer<typeof ShapeSchema>',
    )
  })

  it.concurrent('valibot: anyOf — v.union', () => {
    const result = extractSchemaExports('Shape', schema as any, 'valibot')
    expect(result).toBe(
      'export const ShapeSchema = v.union([v.number(),v.boolean()])\n\nexport type Shape = v.InferOutput<typeof ShapeSchema>',
    )
  })

  it.concurrent('typebox: anyOf — Type.Union', () => {
    const result = extractSchemaExports('Shape', schema as any, 'typebox')
    expect(result).toBe(
      'export const ShapeSchema = Type.Union([Type.Number(),Type.Boolean()])\n\nexport type Shape = Static<typeof ShapeSchema>',
    )
  })

  it.concurrent('arktype: anyOf — union', () => {
    const result = extractSchemaExports('Shape', schema as any, 'arktype')
    expect(result).toBe(
      'export const ShapeSchema = type("number | boolean")\n\nexport type Shape = typeof ShapeSchema.infer',
    )
  })

  it.concurrent('effect: anyOf — Schema.Union', () => {
    const result = extractSchemaExports('Shape', schema as any, 'effect')
    expect(result).toBe(
      'export const ShapeSchema = Schema.Union(Schema.Number,Schema.Boolean)\n\nexport type Shape = typeof ShapeSchema.Encoded',
    )
  })
})

// ===================================================================
// 9. extractSchemaExports — not schema (typed-predicate refinement)
// ===================================================================
describe('extractSchemaExports: not schema (typed predicate)', () => {
  const schema = {
    not: { type: 'string' as const },
  }

  it.concurrent('zod: not — z.any().refine', () => {
    const result = extractSchemaExports('Shape', schema as any, 'zod')
    expect(result).toBe(
      "export const ShapeSchema = z.any().refine((v) => typeof v !== 'string')\n\nexport type Shape = z.infer<typeof ShapeSchema>",
    )
  })

  it.concurrent('valibot: not — v.custom predicate', () => {
    const result = extractSchemaExports('Shape', schema as any, 'valibot')
    expect(result).toBe(
      "export const ShapeSchema = v.custom<unknown>((v) => typeof v !== 'string')\n\nexport type Shape = v.InferOutput<typeof ShapeSchema>",
    )
  })

  it.concurrent('typebox: not — Type.Not()', () => {
    const result = extractSchemaExports('Shape', schema as any, 'typebox')
    expect(result).toBe(
      'export const ShapeSchema = Type.Not(Type.String())\n\nexport type Shape = Static<typeof ShapeSchema>',
    )
  })

  it.concurrent('arktype: not — type("unknown").narrow', () => {
    const result = extractSchemaExports('Shape', schema as any, 'arktype')
    expect(result).toBe(
      'export const ShapeSchema = type("unknown").narrow((v: unknown) => typeof v !== \'string\')\n\nexport type Shape = typeof ShapeSchema.infer',
    )
  })

  it.concurrent('effect: not — Schema.Unknown.pipe(Schema.filter)', () => {
    const result = extractSchemaExports('Shape', schema as any, 'effect')
    expect(result).toBe(
      "export const ShapeSchema = Schema.Unknown.pipe(Schema.filter((v) => typeof v !== 'string'))\n\nexport type Shape = typeof ShapeSchema.Encoded",
    )
  })
})

// ===================================================================
// 10. extractSchemaExports — x-error-message custom error messages
// ===================================================================
describe('extractSchemaExports: x-error-message', () => {
  const schema = {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string' as const,
        minLength: 1,
        'x-error-message': 'Name is required',
      },
    },
    required: ['name'],
  }

  it.concurrent('zod: x-error-message on string property', () => {
    const result = extractSchemaExports('Form', schema as any, 'zod')
    expect(result).toBe(
      'export const FormSchema = z.object({name:z.string({error:"Name is required"}).min(1)})\n\nexport type Form = z.infer<typeof FormSchema>',
    )
  })

  it.concurrent('valibot: x-error-message on string property', () => {
    const result = extractSchemaExports('Form', schema as any, 'valibot')
    expect(result).toBe(
      'export const FormSchema = v.object({name:v.pipe(v.string("Name is required"),v.minLength(1))})\n\nexport type Form = v.InferOutput<typeof FormSchema>',
    )
  })

  it.concurrent('effect: x-error-message on string property', () => {
    const result = extractSchemaExports('Form', schema as any, 'effect')
    expect(result).toBe(
      'export const FormSchema = Schema.Struct({name:Schema.String.pipe(Schema.minLength(1)).annotations({message:()=>"Name is required"})})\n\nexport type Form = typeof FormSchema.Encoded',
    )
  })
})

// ===================================================================
// 11. extractSchemaExports — x-pattern-message
// ===================================================================
describe('extractSchemaExports: x-pattern-message', () => {
  const schema = {
    type: 'object' as const,
    properties: {
      code: {
        type: 'string' as const,
        pattern: '^[A-Z]+$',
        'x-pattern-message': 'Must be uppercase',
      },
    },
    required: ['code'],
  }

  it.concurrent('zod: x-pattern-message', () => {
    const result = extractSchemaExports('Form', schema as any, 'zod')
    expect(result).toBe(
      'export const FormSchema = z.object({code:z.string().regex(/^[A-Z]+$/,{error:"Must be uppercase"})})\n\nexport type Form = z.infer<typeof FormSchema>',
    )
  })

  it.concurrent('valibot: x-pattern-message', () => {
    const result = extractSchemaExports('Form', schema as any, 'valibot')
    expect(result).toBe(
      'export const FormSchema = v.object({code:v.pipe(v.string(),v.regex(/^[A-Z]+$/,"Must be uppercase"))})\n\nexport type Form = v.InferOutput<typeof FormSchema>',
    )
  })
})

// ===================================================================
// 12. extractSchemaExports — x-minimum-message / x-maximum-message
// ===================================================================
describe('extractSchemaExports: x-minimum-message / x-maximum-message', () => {
  const schema = {
    type: 'object' as const,
    properties: {
      score: {
        type: 'integer' as const,
        minimum: 0,
        maximum: 100,
        'x-minimum-message': 'Too small',
        'x-maximum-message': 'Too large',
      },
    },
    required: ['score'],
  }

  it.concurrent('zod: x-minimum-message / x-maximum-message', () => {
    const result = extractSchemaExports('Form', schema as any, 'zod')
    expect(result).toBe(
      'export const FormSchema = z.object({score:z.int().min(0,{error:"Too small"}).max(100,{error:"Too large"})})\n\nexport type Form = z.infer<typeof FormSchema>',
    )
  })

  it.concurrent('valibot: x-minimum-message / x-maximum-message', () => {
    const result = extractSchemaExports('Form', schema as any, 'valibot')
    expect(result).toBe(
      'export const FormSchema = v.object({score:v.pipe(v.number(),v.integer(),v.minValue(0,"Too small"),v.maxValue(100,"Too large"))})\n\nexport type Form = v.InferOutput<typeof FormSchema>',
    )
  })

  it.concurrent('effect: x-minimum-message / x-maximum-message', () => {
    const result = extractSchemaExports('Form', schema as any, 'effect')
    expect(result).toBe(
      'export const FormSchema = Schema.Struct({score:Schema.Number.pipe(Schema.int(),Schema.greaterThanOrEqualTo(0,{message:()=>"Too small"}),Schema.lessThanOrEqualTo(100,{message:()=>"Too large"}))})\n\nexport type Form = typeof FormSchema.Encoded',
    )
  })
})

// ===================================================================
// 13. extractSchemaExports — readonly simple object per library
// ===================================================================
describe('extractSchemaExports: readonly simple object', () => {
  const schema = {
    type: 'object' as const,
    properties: { name: { type: 'string' as const } },
    required: ['name'],
  }

  it.concurrent('zod: readonly simple object', () => {
    const result = extractSchemaExports('Item', schema, 'zod', true, true)
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string()}).readonly()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: readonly simple object', () => {
    const result = extractSchemaExports('Item', schema, 'valibot', true, true)
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.object({name:v.string()}),v.readonly())\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: readonly simple object', () => {
    const result = extractSchemaExports('Item', schema, 'typebox', true, true)
    expect(result).toBe(
      'export const ItemSchema = Type.Readonly(Type.Object({name:Type.String()}))\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: readonly simple object', () => {
    const result = extractSchemaExports('Item', schema, 'arktype', true, true)
    expect(result).toBe(
      'export const ItemSchema = type({name:"string"}).readonly()\n\nexport type Item = typeof ItemSchema.infer',
    )
  })

  it.concurrent('effect: readonly simple object (no change)', () => {
    const result = extractSchemaExports('Item', schema, 'effect', true, true)
    expect(result).toBe(
      'export const ItemSchema = Schema.Struct({name:Schema.String})\n\nexport type Item = typeof ItemSchema.Encoded',
    )
  })
})

// ===================================================================
// 14. extractSchemaExports — readonly + exportType: false
// ===================================================================
describe('extractSchemaExports: readonly + exportType false', () => {
  const schema = {
    type: 'object' as const,
    properties: { name: { type: 'string' as const } },
    required: ['name'],
  }

  it.concurrent('zod: readonly + exportType false', () => {
    const result = extractSchemaExports('Item', schema, 'zod', false, true)
    expect(result).toBe('export const ItemSchema = z.object({name:z.string()}).readonly()')
  })

  it.concurrent('valibot: readonly + exportType false', () => {
    const result = extractSchemaExports('Item', schema, 'valibot', false, true)
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.object({name:v.string()}),v.readonly())',
    )
  })

  it.concurrent('typebox: readonly + exportType false', () => {
    const result = extractSchemaExports('Item', schema, 'typebox', false, true)
    expect(result).toBe(
      'export const ItemSchema = Type.Readonly(Type.Object({name:Type.String()}))',
    )
  })

  it.concurrent('arktype: readonly + exportType false', () => {
    const result = extractSchemaExports('Item', schema, 'arktype', false, true)
    expect(result).toBe('export const ItemSchema = type({name:"string"}).readonly()')
  })

  it.concurrent('effect: readonly + exportType false (no change)', () => {
    const result = extractSchemaExports('Item', schema, 'effect', false, true)
    expect(result).toBe('export const ItemSchema = Schema.Struct({name:Schema.String})')
  })
})

// ===================================================================
// 15. extractSchemaExports — readonly + nested array
// ===================================================================
describe('extractSchemaExports: readonly + nested array', () => {
  const schema = {
    type: 'object' as const,
    properties: {
      name: { type: 'string' as const },
      tags: { type: 'array' as const, items: { type: 'string' as const } },
    },
    required: ['name', 'tags'],
  }

  it.concurrent('zod: readonly + nested array', () => {
    const result = extractSchemaExports('Item', schema, 'zod', true, true)
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string(),tags:z.array(z.string()).readonly()}).readonly()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: readonly + nested array', () => {
    const result = extractSchemaExports('Item', schema, 'valibot', true, true)
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.object({name:v.string(),tags:v.pipe(v.array(v.string()),v.readonly())}),v.readonly())\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: readonly + nested array', () => {
    const result = extractSchemaExports('Item', schema, 'typebox', true, true)
    expect(result).toBe(
      'export const ItemSchema = Type.Readonly(Type.Object({name:Type.String(),tags:Type.Readonly(Type.Array(Type.String()))}))\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: readonly + nested array', () => {
    const result = extractSchemaExports('Item', schema, 'arktype', true, true)
    expect(result).toBe(
      'export const ItemSchema = type({name:"string",tags:"string[]"}).readonly()\n\nexport type Item = typeof ItemSchema.infer',
    )
  })
})

// ===================================================================
// 16. extractSchemaExports — readonly + description metadata
// ===================================================================
describe('extractSchemaExports: readonly + description', () => {
  const schema = {
    type: 'object' as const,
    description: 'An item',
    properties: { name: { type: 'string' as const } },
    required: ['name'],
  }

  it.concurrent('zod: readonly + description', () => {
    const result = extractSchemaExports('Item', schema, 'zod', true, true)
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string()}).meta({description:"An item"}).readonly()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: readonly + description', () => {
    const result = extractSchemaExports('Item', schema, 'valibot', true, true)
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.pipe(v.object({name:v.string()}),v.description("An item")),v.readonly())\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: readonly + description', () => {
    const result = extractSchemaExports('Item', schema, 'typebox', true, true)
    expect(result).toBe(
      'export const ItemSchema = Type.Readonly(Type.Object({name:Type.String()},{description:"An item"}))\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: readonly + description', () => {
    const result = extractSchemaExports('Item', schema, 'arktype', true, true)
    expect(result).toBe(
      'export const ItemSchema = type({name:"string"}).describe("An item").readonly()\n\nexport type Item = typeof ItemSchema.infer',
    )
  })

  it.concurrent('effect: readonly + description (no change)', () => {
    const result = extractSchemaExports('Item', schema, 'effect', true, true)
    expect(result).toBe(
      'export const ItemSchema = Schema.Struct({name:Schema.String}).annotations({description:"An item"})\n\nexport type Item = typeof ItemSchema.Encoded',
    )
  })
})

describe('extractSchemaExports: deprecated metadata', () => {
  const schema = {
    type: 'object',
    deprecated: true,
    properties: { id: { type: 'integer' } },
  } as const

  it.concurrent('zod: deprecated emits .meta({deprecated:true})', () => {
    const result = extractSchemaExports('Item', schema, 'zod')
    expect(result).toBe(
      'export const ItemSchema = z.object({id:z.int()}).partial().meta({deprecated:true})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: deprecated emits v.metadata({deprecated:true})', () => {
    const result = extractSchemaExports('Item', schema, 'valibot')
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.partial(v.object({id:v.pipe(v.number(),v.integer())})),v.metadata({deprecated:true}))\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('effect: deprecated nests under jsonSchema annotation', () => {
    const result = extractSchemaExports('Item', schema, 'effect')
    expect(result).toBe(
      'export const ItemSchema = Schema.partial(Schema.Struct({id:Schema.Number.pipe(Schema.int())})).annotations({jsonSchema:{deprecated:true}})\n\nexport type Item = typeof ItemSchema.Encoded',
    )
  })
})

describe('extractSchemaExports: combined description + examples + deprecated', () => {
  // `examples` here is an array (JSON Schema 2020-12 form). The static type
  // models OAS 3.0 keyed-map form, so we cast at the test boundary.
  const schema = {
    type: 'object',
    description: 'A user',
    examples: [{ id: 1 }],
    deprecated: true,
    properties: { id: { type: 'integer' } },
    required: ['id'],
  } as const

  it.concurrent('zod: emits all three keys in single .meta call', () => {
    const result = extractSchemaExports('Item', schema as never, 'zod')
    expect(result).toBe(
      'export const ItemSchema = z.object({id:z.int()}).meta({description:"A user",examples:[{id:1}],deprecated:true})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })
})

describe('extractSchemaExports: default value', () => {
  it.concurrent('zod: field-level default emits .default(value)', () => {
    const result = extractSchemaExports(
      'Item',
      { type: 'object', properties: { age: { type: 'integer', default: 0 } } },
      'zod',
    )
    expect(result).toBe(
      'export const ItemSchema = z.object({age:z.int().default(0)}).partial()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: field-level default uses v.optional(schema, default)', () => {
    const result = extractSchemaExports(
      'Item',
      { type: 'object', properties: { age: { type: 'integer', default: 0 } } },
      'valibot',
    )
    expect(result).toBe(
      'export const ItemSchema = v.partial(v.object({age:v.optional(v.pipe(v.number(),v.integer()),0)}))\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('zod: root-level default appended after partial', () => {
    const result = extractSchemaExports(
      'Item',
      { type: 'object', default: { id: 1 }, properties: { id: { type: 'integer' } } },
      'zod',
    )
    expect(result).toBe(
      'export const ItemSchema = z.object({id:z.int()}).partial().default({"id":1})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })
})

describe('extractSchemaExports: string formats', () => {
  it.concurrent('zod: email/uri/date/date-time/uuid map to z.email/z.url/z.iso.date/z.iso.datetime/z.uuid', () => {
    const result = extractSchemaExports(
      'Item',
      {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          url: { type: 'string', format: 'uri' },
          date: { type: 'string', format: 'date' },
          dt: { type: 'string', format: 'date-time' },
          uuid: { type: 'string', format: 'uuid' },
        },
      },
      'zod',
    )
    expect(result).toBe(
      'export const ItemSchema = z.object({email:z.email(),url:z.url(),date:z.iso.date(),dt:z.iso.datetime(),uuid:z.uuid()}).partial()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })
})

describe('extractSchemaExports: numeric constraints', () => {
  it.concurrent('zod: exclusiveMinimum/exclusiveMaximum map to gt/lt', () => {
    const result = extractSchemaExports(
      'Item',
      {
        type: 'object',
        properties: {
          score: { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 100 },
        },
      },
      'zod',
    )
    expect(result).toBe(
      'export const ItemSchema = z.object({score:z.number().gt(0).lt(100)}).partial()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('zod: multipleOf maps to .multipleOf()', () => {
    const result = extractSchemaExports(
      'Item',
      { type: 'object', properties: { count: { type: 'integer', multipleOf: 5 } } },
      'zod',
    )
    expect(result).toBe(
      'export const ItemSchema = z.object({count:z.int().multipleOf(5)}).partial()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })
})

describe('extractSchemaExports: additionalProperties', () => {
  it.concurrent('zod: additionalProperties:false emits z.strictObject', () => {
    const result = extractSchemaExports(
      'Item',
      {
        type: 'object',
        properties: { id: { type: 'integer' } },
        additionalProperties: false,
        required: ['id'],
      },
      'zod',
    )
    expect(result).toBe(
      'export const ItemSchema = z.strictObject({id:z.int()})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('zod: typed additionalProperties on otherwise empty object becomes z.record', () => {
    const result = extractSchemaExports(
      'Item',
      {
        type: 'object',
        properties: { id: { type: 'integer' } },
        additionalProperties: { type: 'string' },
      },
      'zod',
    )
    expect(result).toBe(
      'export const ItemSchema = z.record(z.string(),z.string())\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })
})

describe('extractSchemaExports: field-level metadata', () => {
  it.concurrent('zod: each property carries its own .meta() before .optional()', () => {
    const result = extractSchemaExports(
      'Item',
      {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'User name' },
          age: { type: 'integer', description: 'User age', minimum: 0 },
        },
        required: ['name'],
      },
      'zod',
    )
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string().meta({description:"User name"}),age:z.int().min(0).meta({description:"User age"}).optional()})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('zod: enum value with field-level description', () => {
    const result = extractSchemaExports(
      'Item',
      {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['a', 'b'], description: 'A status' },
        },
      },
      'zod',
    )
    expect(result).toBe(
      'export const ItemSchema = z.object({status:z.enum(["a","b"]).meta({description:"A status"})}).partial()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('zod: nullable field maps to .nullable()', () => {
    const result = extractSchemaExports(
      'Item',
      { type: 'object', properties: { tag: { type: 'string', nullable: true } } },
      'zod',
    )
    expect(result).toBe(
      'export const ItemSchema = z.object({tag:z.string().nullable()}).partial()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })
})

describe('extractSchemaExports: edge metadata', () => {
  it.concurrent('zod: empty examples array still emits examples:[]', () => {
    // `examples` typed as keyed-map; pass array form via cast (JSON Schema input shape).
    const result = extractSchemaExports(
      'Item',
      {
        type: 'object',
        description: 'X',
        examples: [],
        properties: { id: { type: 'integer' } },
      } as never,
      'zod',
    )
    expect(result).toBe(
      'export const ItemSchema = z.object({id:z.int()}).partial().meta({description:"X",examples:[]})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })
})

describe('extractSchemaExports: title override', () => {
  // User-supplied `title` is overridden by the generator's `${name}Schema`
  // naming — the title field is dropped from emitted code in every library.
  const schema = {
    title: 'CustomTitle',
    type: 'object',
    properties: { id: { type: 'integer' } },
  } as const

  it.concurrent('zod: user title is not emitted', () => {
    const result = extractSchemaExports('Item', schema, 'zod')
    expect(result).toBe(
      'export const ItemSchema = z.object({id:z.int()}).partial()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: user title is not emitted', () => {
    const result = extractSchemaExports('Item', schema, 'valibot')
    expect(result).toBe(
      'export const ItemSchema = v.partial(v.object({id:v.pipe(v.number(),v.integer())}))\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: user title is not emitted', () => {
    const result = extractSchemaExports('Item', schema, 'typebox')
    expect(result).toBe(
      'export const ItemSchema = Type.Object({id:Type.Optional(Type.Integer())})\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: user title is not emitted', () => {
    const result = extractSchemaExports('Item', schema, 'arktype')
    expect(result).toBe(
      'export const ItemSchema = type({"id?":"number.integer"})\n\nexport type Item = typeof ItemSchema.infer',
    )
  })

  it.concurrent('effect: user title is not emitted', () => {
    const result = extractSchemaExports('Item', schema, 'effect')
    expect(result).toBe(
      'export const ItemSchema = Schema.partial(Schema.Struct({id:Schema.Number.pipe(Schema.int())}))\n\nexport type Item = typeof ItemSchema.Encoded',
    )
  })
})
