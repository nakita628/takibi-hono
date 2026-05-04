import { describe, expect, it } from 'vite-plus/test'

import { extractSchemaExports } from './schema-expression.js'

describe('extractSchemaExports', () => {
  // --- zod ---
  it.concurrent('zod: basic schema with fixed type name', async () => {
    const result = await extractSchemaExports(
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

  it.concurrent('zod: .describe() when description exists', async () => {
    const result = await extractSchemaExports(
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

  it.concurrent('zod: $ref schemas', async () => {
    const result = await extractSchemaExports(
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
  it.concurrent('valibot: basic schema with fixed type names', async () => {
    const result = await extractSchemaExports(
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

  it.concurrent('valibot: v.pipe with v.description and v.examples', async () => {
    const result = await extractSchemaExports(
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
  it.concurrent('arktype: .describe() when description exists', async () => {
    const result = await extractSchemaExports(
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
  it.concurrent('typebox: constructor options when description exists', async () => {
    const result = await extractSchemaExports(
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

  it.concurrent('typebox: constructor options with description and example', async () => {
    const result = await extractSchemaExports(
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
  it.concurrent('effect: .annotations() when description and example exist', async () => {
    const result = await extractSchemaExports(
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

  it.concurrent('zod: simple object', async () => {
    const result = await extractSchemaExports('Item', schema, 'zod')
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string()})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: simple object', async () => {
    const result = await extractSchemaExports('Item', schema, 'valibot')
    expect(result).toBe(
      'export const ItemSchema = v.object({name:v.string()})\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: simple object', async () => {
    const result = await extractSchemaExports('Item', schema, 'typebox')
    expect(result).toBe(
      'export const ItemSchema = Type.Object({name:Type.String()})\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: simple object', async () => {
    const result = await extractSchemaExports('Item', schema, 'arktype')
    expect(result).toBe(
      'export const ItemSchema = type({name:"string"})\n\nexport type Item = typeof ItemSchema.infer',
    )
  })

  it.concurrent('effect: simple object', async () => {
    const result = await extractSchemaExports('Item', schema, 'effect')
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

  it.concurrent('zod: exportType false', async () => {
    const result = await extractSchemaExports('Item', schema, 'zod', false)
    expect(result).toBe('export const ItemSchema = z.object({name:z.string()})')
  })

  it.concurrent('valibot: exportType false', async () => {
    const result = await extractSchemaExports('Item', schema, 'valibot', false)
    expect(result).toBe('export const ItemSchema = v.object({name:v.string()})')
  })

  it.concurrent('typebox: exportType false', async () => {
    const result = await extractSchemaExports('Item', schema, 'typebox', false)
    expect(result).toBe('export const ItemSchema = Type.Object({name:Type.String()})')
  })

  it.concurrent('arktype: exportType false', async () => {
    const result = await extractSchemaExports('Item', schema, 'arktype', false)
    expect(result).toBe('export const ItemSchema = type({name:"string"})')
  })

  it.concurrent('effect: exportType false', async () => {
    const result = await extractSchemaExports('Item', schema, 'effect', false)
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

  it.concurrent('zod: description', async () => {
    const result = await extractSchemaExports('Item', schema, 'zod')
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string()}).meta({description:"An item"})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: description', async () => {
    const result = await extractSchemaExports('Item', schema, 'valibot')
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.object({name:v.string()}),v.description("An item"))\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: description', async () => {
    const result = await extractSchemaExports('Item', schema, 'typebox')
    expect(result).toBe(
      'export const ItemSchema = Type.Object({name:Type.String()},{description:"An item"})\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: description', async () => {
    const result = await extractSchemaExports('Item', schema, 'arktype')
    expect(result).toBe(
      'export const ItemSchema = type({name:"string"}).describe("An item")\n\nexport type Item = typeof ItemSchema.infer',
    )
  })

  it.concurrent('effect: description', async () => {
    const result = await extractSchemaExports('Item', schema, 'effect')
    expect(result).toBe(
      'export const ItemSchema = Schema.Struct({name:Schema.String}).annotations({description:"An item"})\n\nexport type Item = typeof ItemSchema.Encoded',
    )
  })
})

// ===================================================================
// 4. extractSchemaExports — example metadata for valibot and effect
// ===================================================================
describe('extractSchemaExports: example metadata', () => {
  it.concurrent('valibot: example only (no description)', async () => {
    const result = await extractSchemaExports(
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

  it.concurrent('effect: example only (no description)', async () => {
    const result = await extractSchemaExports(
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

  it.concurrent('zod: allOf 3 items — z.intersection nesting', async () => {
    const result = await extractSchemaExports('Combined', allOf3Schema as any, 'zod')
    expect(result).toBe(
      'export const CombinedSchema = z.intersection(z.intersection(z.object({a:z.string()}),z.object({b:z.string()})),z.object({c:z.string()}))\n\nexport type Combined = z.infer<typeof CombinedSchema>',
    )
  })

  it.concurrent('effect: allOf 3 items — Schema.extend nesting', async () => {
    const result = await extractSchemaExports('Combined', allOf3Schema as any, 'effect')
    expect(result).toBe(
      'export const CombinedSchema = Schema.extend(Schema.extend(Schema.Struct({a:Schema.String}),Schema.Struct({b:Schema.String})),Schema.Struct({c:Schema.String}))\n\nexport type Combined = typeof CombinedSchema.Encoded',
    )
  })

  it.concurrent('valibot: allOf 3 items — no nesting (uses array)', async () => {
    const result = await extractSchemaExports('Combined', allOf3Schema as any, 'valibot')
    expect(result).toBe(
      'export const CombinedSchema = v.intersect([v.object({a:v.string()}),v.object({b:v.string()}),v.object({c:v.string()})])\n\nexport type Combined = v.InferOutput<typeof CombinedSchema>',
    )
  })

  it.concurrent('typebox: allOf 3 items — no nesting (uses array)', async () => {
    const result = await extractSchemaExports('Combined', allOf3Schema as any, 'typebox')
    expect(result).toBe(
      'export const CombinedSchema = Type.Intersect([Type.Object({a:Type.String()}),Type.Object({b:Type.String()}),Type.Object({c:Type.String()})])\n\nexport type Combined = Static<typeof CombinedSchema>',
    )
  })

  it.concurrent('arktype: allOf 3 items — chained .and()', async () => {
    const result = await extractSchemaExports('Combined', allOf3Schema as any, 'arktype')
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

  it.concurrent('zod: allOf 4 items — deep z.intersection nesting', async () => {
    const result = await extractSchemaExports('Merged', allOf4Schema as any, 'zod')
    expect(result).toBe(
      'export const MergedSchema = z.intersection(z.intersection(z.intersection(z.object({a:z.string()}),z.object({b:z.string()})),z.object({c:z.string()})),z.object({d:z.string()}))\n\nexport type Merged = z.infer<typeof MergedSchema>',
    )
  })

  it.concurrent('effect: allOf 4 items — deep Schema.extend nesting', async () => {
    const result = await extractSchemaExports('Merged', allOf4Schema as any, 'effect')
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

  it.concurrent('zod: meta with description and examples', async () => {
    const result = await extractSchemaExports('Item', schema, 'zod')
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string()}).meta({description:"An item",examples:[{name:"test"}]})\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: v.pipe with description and examples', async () => {
    const result = await extractSchemaExports('Item', schema, 'valibot')
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.object({name:v.string()}),v.description("An item"),v.metadata({examples:[{name:"test"}]}))\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: constructor options with description and examples', async () => {
    const result = await extractSchemaExports('Item', schema, 'typebox')
    expect(result).toBe(
      'export const ItemSchema = Type.Object({name:Type.String()},{description:"An item",examples:[{name:"test"}]})\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: description only (example ignored)', async () => {
    const result = await extractSchemaExports('Item', schema, 'arktype')
    expect(result).toBe(
      'export const ItemSchema = type({name:"string"}).describe("An item")\n\nexport type Item = typeof ItemSchema.infer',
    )
  })

  it.concurrent('effect: annotations with description and examples', async () => {
    const result = await extractSchemaExports('Item', schema, 'effect')
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

  it.concurrent('zod: oneOf without discriminator — z.xor', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'zod')
    expect(result).toBe(
      'export const ShapeSchema = z.xor([z.string(),z.int()])\n\nexport type Shape = z.infer<typeof ShapeSchema>',
    )
  })

  it.concurrent('valibot: oneOf — v.union', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'valibot')
    expect(result).toBe(
      'export const ShapeSchema = v.union([v.string(),v.pipe(v.number(),v.integer())])\n\nexport type Shape = v.InferOutput<typeof ShapeSchema>',
    )
  })

  it.concurrent('typebox: oneOf — Type.Union', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'typebox')
    expect(result).toBe(
      'export const ShapeSchema = Type.Union([Type.String(),Type.Integer()])\n\nexport type Shape = Static<typeof ShapeSchema>',
    )
  })

  it.concurrent('arktype: oneOf — union', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'arktype')
    expect(result).toBe(
      'export const ShapeSchema = type("string | number.integer")\n\nexport type Shape = typeof ShapeSchema.infer',
    )
  })

  it.concurrent('effect: oneOf — Schema.Union', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'effect')
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

  it.concurrent('zod: anyOf — z.union', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'zod')
    expect(result).toBe(
      'export const ShapeSchema = z.union([z.number(),z.boolean()])\n\nexport type Shape = z.infer<typeof ShapeSchema>',
    )
  })

  it.concurrent('valibot: anyOf — v.union', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'valibot')
    expect(result).toBe(
      'export const ShapeSchema = v.union([v.number(),v.boolean()])\n\nexport type Shape = v.InferOutput<typeof ShapeSchema>',
    )
  })

  it.concurrent('typebox: anyOf — Type.Union', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'typebox')
    expect(result).toBe(
      'export const ShapeSchema = Type.Union([Type.Number(),Type.Boolean()])\n\nexport type Shape = Static<typeof ShapeSchema>',
    )
  })

  it.concurrent('arktype: anyOf — union', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'arktype')
    expect(result).toBe(
      'export const ShapeSchema = type("number | boolean")\n\nexport type Shape = typeof ShapeSchema.infer',
    )
  })

  it.concurrent('effect: anyOf — Schema.Union', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'effect')
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

  it.concurrent('zod: not — z.any().refine', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'zod')
    expect(result).toBe(
      "export const ShapeSchema = z.any().refine((v) => typeof v !== 'string')\n\nexport type Shape = z.infer<typeof ShapeSchema>",
    )
  })

  it.concurrent('valibot: not — v.custom predicate', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'valibot')
    expect(result).toBe(
      "export const ShapeSchema = v.custom<unknown>((v) => typeof v !== 'string')\n\nexport type Shape = v.InferOutput<typeof ShapeSchema>",
    )
  })

  it.concurrent('typebox: not — Type.Not()', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'typebox')
    expect(result).toBe(
      'export const ShapeSchema = Type.Not(Type.String())\n\nexport type Shape = Static<typeof ShapeSchema>',
    )
  })

  it.concurrent('arktype: not — type("unknown").narrow', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'arktype')
    expect(result).toBe(
      "export const ShapeSchema = type(\"unknown\").narrow((v: unknown) => typeof v !== 'string')\n\nexport type Shape = typeof ShapeSchema.infer",
    )
  })

  it.concurrent('effect: not — Schema.Unknown.pipe(Schema.filter)', async () => {
    const result = await extractSchemaExports('Shape', schema as any, 'effect')
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

  it.concurrent('zod: x-error-message on string property', async () => {
    const result = await extractSchemaExports('Form', schema as any, 'zod')
    expect(result).toBe(
      'export const FormSchema = z.object({name:z.string({error:"Name is required"}).min(1)})\n\nexport type Form = z.infer<typeof FormSchema>',
    )
  })

  it.concurrent('valibot: x-error-message on string property', async () => {
    const result = await extractSchemaExports('Form', schema as any, 'valibot')
    expect(result).toBe(
      'export const FormSchema = v.object({name:v.pipe(v.string("Name is required"),v.minLength(1))})\n\nexport type Form = v.InferOutput<typeof FormSchema>',
    )
  })

  it.concurrent('effect: x-error-message on string property', async () => {
    const result = await extractSchemaExports('Form', schema as any, 'effect')
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

  it.concurrent('zod: x-pattern-message', async () => {
    const result = await extractSchemaExports('Form', schema as any, 'zod')
    expect(result).toBe(
      'export const FormSchema = z.object({code:z.string().regex(/^[A-Z]+$/,{error:"Must be uppercase"})})\n\nexport type Form = z.infer<typeof FormSchema>',
    )
  })

  it.concurrent('valibot: x-pattern-message', async () => {
    const result = await extractSchemaExports('Form', schema as any, 'valibot')
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

  it.concurrent('zod: x-minimum-message / x-maximum-message', async () => {
    const result = await extractSchemaExports('Form', schema as any, 'zod')
    expect(result).toBe(
      'export const FormSchema = z.object({score:z.int().min(0,{error:"Too small"}).max(100,{error:"Too large"})})\n\nexport type Form = z.infer<typeof FormSchema>',
    )
  })

  it.concurrent('valibot: x-minimum-message / x-maximum-message', async () => {
    const result = await extractSchemaExports('Form', schema as any, 'valibot')
    expect(result).toBe(
      'export const FormSchema = v.object({score:v.pipe(v.number(),v.integer(),v.minValue(0,"Too small"),v.maxValue(100,"Too large"))})\n\nexport type Form = v.InferOutput<typeof FormSchema>',
    )
  })

  it.concurrent('effect: x-minimum-message / x-maximum-message', async () => {
    const result = await extractSchemaExports('Form', schema as any, 'effect')
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

  it.concurrent('zod: readonly simple object', async () => {
    const result = await extractSchemaExports('Item', schema, 'zod', true, true)
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string()}).readonly()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: readonly simple object', async () => {
    const result = await extractSchemaExports('Item', schema, 'valibot', true, true)
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.object({name:v.string()}),v.readonly())\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: readonly simple object', async () => {
    const result = await extractSchemaExports('Item', schema, 'typebox', true, true)
    expect(result).toBe(
      'export const ItemSchema = Type.Readonly(Type.Object({name:Type.String()}))\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: readonly simple object', async () => {
    const result = await extractSchemaExports('Item', schema, 'arktype', true, true)
    expect(result).toBe(
      'export const ItemSchema = type({name:"string"}).readonly()\n\nexport type Item = typeof ItemSchema.infer',
    )
  })

  it.concurrent('effect: readonly simple object (no change)', async () => {
    const result = await extractSchemaExports('Item', schema, 'effect', true, true)
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

  it.concurrent('zod: readonly + exportType false', async () => {
    const result = await extractSchemaExports('Item', schema, 'zod', false, true)
    expect(result).toBe('export const ItemSchema = z.object({name:z.string()}).readonly()')
  })

  it.concurrent('valibot: readonly + exportType false', async () => {
    const result = await extractSchemaExports('Item', schema, 'valibot', false, true)
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.object({name:v.string()}),v.readonly())',
    )
  })

  it.concurrent('typebox: readonly + exportType false', async () => {
    const result = await extractSchemaExports('Item', schema, 'typebox', false, true)
    expect(result).toBe(
      'export const ItemSchema = Type.Readonly(Type.Object({name:Type.String()}))',
    )
  })

  it.concurrent('arktype: readonly + exportType false', async () => {
    const result = await extractSchemaExports('Item', schema, 'arktype', false, true)
    expect(result).toBe('export const ItemSchema = type({name:"string"}).readonly()')
  })

  it.concurrent('effect: readonly + exportType false (no change)', async () => {
    const result = await extractSchemaExports('Item', schema, 'effect', false, true)
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

  it.concurrent('zod: readonly + nested array', async () => {
    const result = await extractSchemaExports('Item', schema, 'zod', true, true)
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string(),tags:z.array(z.string()).readonly()}).readonly()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: readonly + nested array', async () => {
    const result = await extractSchemaExports('Item', schema, 'valibot', true, true)
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.object({name:v.string(),tags:v.pipe(v.array(v.string()),v.readonly())}),v.readonly())\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: readonly + nested array', async () => {
    const result = await extractSchemaExports('Item', schema, 'typebox', true, true)
    expect(result).toBe(
      'export const ItemSchema = Type.Readonly(Type.Object({name:Type.String(),tags:Type.Readonly(Type.Array(Type.String()))}))\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: readonly + nested array', async () => {
    const result = await extractSchemaExports('Item', schema, 'arktype', true, true)
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

  it.concurrent('zod: readonly + description', async () => {
    const result = await extractSchemaExports('Item', schema, 'zod', true, true)
    expect(result).toBe(
      'export const ItemSchema = z.object({name:z.string()}).meta({description:"An item"}).readonly()\n\nexport type Item = z.infer<typeof ItemSchema>',
    )
  })

  it.concurrent('valibot: readonly + description', async () => {
    const result = await extractSchemaExports('Item', schema, 'valibot', true, true)
    expect(result).toBe(
      'export const ItemSchema = v.pipe(v.pipe(v.object({name:v.string()}),v.description("An item")),v.readonly())\n\nexport type Item = v.InferOutput<typeof ItemSchema>',
    )
  })

  it.concurrent('typebox: readonly + description', async () => {
    const result = await extractSchemaExports('Item', schema, 'typebox', true, true)
    expect(result).toBe(
      'export const ItemSchema = Type.Readonly(Type.Object({name:Type.String()},{description:"An item"}))\n\nexport type Item = Static<typeof ItemSchema>',
    )
  })

  it.concurrent('arktype: readonly + description', async () => {
    const result = await extractSchemaExports('Item', schema, 'arktype', true, true)
    expect(result).toBe(
      'export const ItemSchema = type({name:"string"}).describe("An item").readonly()\n\nexport type Item = typeof ItemSchema.infer',
    )
  })

  it.concurrent('effect: readonly + description (no change)', async () => {
    const result = await extractSchemaExports('Item', schema, 'effect', true, true)
    expect(result).toBe(
      'export const ItemSchema = Schema.Struct({name:Schema.String}).annotations({description:"An item"})\n\nexport type Item = typeof ItemSchema.Encoded',
    )
  })
})
