import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterAll, describe, expect, it } from 'vite-plus/test'

import { makeSchemasCode, makeSplitSchemas } from './schemas.js'

describe('makeSchemasCode', () => {
  it.concurrent('should generate schemas file with zod (no types by default)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
          },
          required: ['name'],
        },
      },
      'zod',
    )
    expect(result).toBe(
      `import*as z from'zod'

export const UserSchema = z.object({name:z.string(),age:z.int().optional()})`,
    )
  })

  it.concurrent('should append .describe() when description exists (no types by default)', async () => {
    const result = await makeSchemasCode(
      {
        Pet: {
          type: 'object',
          description: 'A pet',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      },
      'zod',
    )
    expect(result).toBe(
      `import*as z from'zod'

export const PetSchema = z.object({name:z.string()}).meta({description:"A pet"})`,
    )
  })

  it.concurrent('should generate schemas file with valibot (no types by default)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      },
      'valibot',
    )
    expect(result).toBe(
      `import*as v from'valibot'

export const UserSchema = v.object({name:v.string()})`,
    )
  })

  it.concurrent('should handle multiple schemas (no types by default)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        Todo: {
          type: 'object',
          properties: { title: { type: 'string' } },
          required: ['title'],
        },
      },
      'zod',
    )
    expect(result).toBe(
      `import*as z from'zod'

export const UserSchema = z.object({name:z.string()})

export const TodoSchema = z.object({title:z.string()})`,
    )
  })

  it.concurrent('should export types when exportTypes is true (zod)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'zod',
      { exportTypes: true },
    )
    expect(result).toBe(
      `import*as z from'zod'

export const UserSchema = z.object({name:z.string()})

export type User = z.infer<typeof UserSchema>`,
    )
  })

  it.concurrent('should export types when exportTypes is true (valibot)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'valibot',
      { exportTypes: true },
    )
    expect(result).toBe(
      `import*as v from'valibot'

export const UserSchema = v.object({name:v.string()})

export type User = v.InferOutput<typeof UserSchema>`,
    )
  })

  it.concurrent('should export types when exportTypes is true (typebox)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'typebox',
      { exportTypes: true },
    )
    expect(result).toBe(
      `import Type from'typebox'
import type{Static}from'typebox'

export const UserSchema = Type.Object({name:Type.String()})

export type User = Static<typeof UserSchema>`,
    )
  })

  it.concurrent('should export types when exportTypes is true (arktype)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'arktype',
      { exportTypes: true },
    )
    expect(result).toBe(
      `import{type}from'arktype'

export const UserSchema = type({name:"string"})

export type User = typeof UserSchema.infer`,
    )
  })

  it.concurrent('should export Encoded type only when exportTypes is true (effect)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'effect',
      { exportTypes: true },
    )
    expect(result).toBe(
      `import{Schema}from'effect'

export const UserSchema = Schema.Struct({name:Schema.String})

export type User = typeof UserSchema.Encoded`,
    )
  })

  it.concurrent('should export types with multiple schemas when exportTypes is true', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        Todo: {
          type: 'object',
          properties: { title: { type: 'string' } },
          required: ['title'],
        },
      },
      'zod',
      { exportTypes: true },
    )
    expect(result).toBe(
      `import*as z from'zod'

export const UserSchema = z.object({name:z.string()})

export type User = z.infer<typeof UserSchema>

export const TodoSchema = z.object({title:z.string()})

export type Todo = z.infer<typeof TodoSchema>`,
    )
  })

  it.concurrent('should export Encoded type with description and example (effect)', async () => {
    const result = await makeSchemasCode(
      {
        Pet: {
          type: 'object',
          description: 'A pet',
          example: { name: 'Buddy' },
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'effect',
      { exportTypes: true },
    )
    expect(result).toBe(
      `import{Schema}from'effect'

export const PetSchema = Schema.Struct({name:Schema.String}).annotations({description:"A pet",examples:[{name:"Buddy"}]})

export type Pet = typeof PetSchema.Encoded`,
    )
  })

  it.concurrent('should not export types when exportTypes is false', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'zod',
      { exportTypes: false },
    )
    expect(result).toBe(
      `import*as z from'zod'

export const UserSchema = z.object({name:z.string()})`,
    )
  })

  it.concurrent('should generate typebox schemas without Static import by default', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'typebox',
    )
    expect(result).toBe(
      `import Type from'typebox'

export const UserSchema = Type.Object({name:Type.String()})`,
    )
  })

  it.concurrent('should generate valibot schemas without types by default', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'valibot',
    )
    expect(result).toBe(
      `import*as v from'valibot'

export const UserSchema = v.object({name:v.string()})`,
    )
  })

  it.concurrent('should generate effect schemas without types by default', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'effect',
    )
    expect(result).toBe(
      `import{Schema}from'effect'

export const UserSchema = Schema.Struct({name:Schema.String})`,
    )
  })

  it.concurrent('should generate arktype schemas without types by default', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
          },
          required: ['name'],
        },
      },
      'arktype',
    )
    expect(result).toBe(
      `import{type}from'arktype'

export const UserSchema = type({name:"string","age?":"number.integer"})`,
    )
  })

  it.concurrent('should generate typebox schemas without Static import when exportTypes is false', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'typebox',
      { exportTypes: false },
    )
    expect(result).toBe(
      `import Type from'typebox'

export const UserSchema = Type.Object({name:Type.String()})`,
    )
  })

  it.concurrent('should generate valibot schemas with v.pipe wrapping for description and example metadata (no types by default)', async () => {
    const result = await makeSchemasCode(
      {
        Pet: {
          type: 'object',
          description: 'A pet',
          example: { name: 'Fido' },
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'valibot',
    )
    expect(result).toBe(
      `import*as v from'valibot'

export const PetSchema = v.pipe(v.object({name:v.string()}),v.description("A pet"),v.metadata({examples:[{name:"Fido"}]}))`,
    )
  })

  it.concurrent('should apply z.lazy wrapper for circular self-referencing schemas with zod (no types by default)', async () => {
    const result = await makeSchemasCode(
      {
        Category: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' },
            },
          },
          required: ['name'],
        },
      },
      'zod',
    )
    expect(result).toBe(
      `import*as z from'zod'

type CategoryType={name:string;children?:CategoryType[]}

export const CategorySchema:z.ZodType<CategoryType>= z.lazy(() => z.object({name:z.string(),children:z.array(CategorySchema).optional()}))`,
    )
  })

  it.concurrent('should apply v.lazy wrapper for circular self-referencing schemas with valibot (no types by default)', async () => {
    const result = await makeSchemasCode(
      {
        Category: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' },
            },
          },
          required: ['name'],
        },
      },
      'valibot',
    )
    expect(result).toBe(
      `import*as v from'valibot'

export const CategorySchema:v.GenericSchema= v.lazy(() => v.object({name:v.string(),children:v.optional(v.array(v.lazy(() => CategorySchema)))}))`,
    )
  })

  it.concurrent('should handle $ref to another schema (no types by default)', async () => {
    const result = await makeSchemasCode(
      {
        Pet: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        Owner: {
          type: 'object',
          properties: { pet: { $ref: '#/components/schemas/Pet' } },
          required: ['pet'],
        },
      },
      'zod',
    )
    expect(result).toBe(
      `import*as z from'zod'

export const PetSchema = z.object({name:z.string()})

export const OwnerSchema = z.object({pet:PetSchema})`,
    )
  })

  it.concurrent('should handle allOf composition (no types by default)', async () => {
    const result = await makeSchemasCode(
      {
        Base: {
          type: 'object',
          properties: { id: { type: 'integer' } },
          required: ['id'],
        },
        Extended: {
          allOf: [
            { $ref: '#/components/schemas/Base' },
            {
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            },
          ],
        },
      },
      'zod',
    )
    expect(result).toBe(
      `import*as z from'zod'

export const BaseSchema = z.object({id:z.int()})

export const ExtendedSchema = z.intersection(BaseSchema,z.object({name:z.string()}))`,
    )
  })

  // --- effect self-referencing ---
  it.concurrent('should apply Schema.suspend wrapper for circular self-referencing schemas with effect', async () => {
    const result = await makeSchemasCode(
      {
        Category: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' },
            },
          },
          required: ['name'],
        },
      },
      'effect',
    )
    expect(result).toBe(
      `import{Schema}from'effect'

export const CategorySchema:Schema.Schema<any>= Schema.suspend(() => Schema.Struct({name:Schema.String,children:Schema.optional(Schema.Array(Schema.suspend(() => CategorySchema)))}))`,
    )
  })

  // --- typebox self-referencing ---
  it.concurrent('should apply Type.Recursive wrapper for circular self-referencing schemas with typebox', async () => {
    const result = await makeSchemasCode(
      {
        Category: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' },
            },
          },
          required: ['name'],
        },
      },
      'typebox',
    )
    expect(result).toBe(
      `import Type from'typebox'

export const CategorySchema = Type.Recursive(This => Type.Object({name:Type.String(),children:Type.Optional(Type.Array(This))}))`,
    )
  })

  // --- arktype self-referencing ---
  it.concurrent('should handle circular self-referencing schemas with arktype', async () => {
    const result = await makeSchemasCode(
      {
        Category: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' },
            },
          },
          required: ['name'],
        },
      },
      'arktype',
    )
    expect(result).toBe(
      `import{type}from'arktype'

export const CategorySchema = type({name:"string","children?":"CategorySchema[]"})`,
    )
  })

  // --- mutual circular reference (A↔B) with zod ---
  it.concurrent('should handle mutual circular references (A↔B) with zod', async () => {
    const result = await makeSchemasCode(
      {
        A: {
          type: 'object',
          properties: {
            b: { $ref: '#/components/schemas/B' },
          },
          required: ['b'],
        },
        B: {
          type: 'object',
          properties: {
            a: { $ref: '#/components/schemas/A' },
          },
          required: ['a'],
        },
      },
      'zod',
    )
    expect(result).toBe(
      `import*as z from'zod'

export const BSchema:z.ZodType<BType>= z.lazy(() => z.object({a:ASchema}))

type AType={b:z.infer<typeof BSchema>}

export const ASchema:z.ZodType<AType>= z.lazy(() => z.object({b:BSchema}))

type BType={a:z.infer<typeof ASchema>}`,
    )
  })

  // --- readonly per library ---
  it.concurrent('should generate readonly schemas with zod', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'zod',
      { readonly: true },
    )
    expect(result).toBe(
      `import*as z from'zod'

export const UserSchema = z.object({name:z.string()}).readonly()`,
    )
  })

  it.concurrent('should generate readonly schemas with valibot', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'valibot',
      { readonly: true },
    )
    expect(result).toBe(
      `import*as v from'valibot'

export const UserSchema = v.pipe(v.object({name:v.string()}),v.readonly())`,
    )
  })

  it.concurrent('should generate readonly schemas with typebox', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'typebox',
      { readonly: true },
    )
    expect(result).toBe(
      `import Type from'typebox'

export const UserSchema = Type.Readonly(Type.Object({name:Type.String()}))`,
    )
  })

  it.concurrent('should generate readonly schemas with arktype', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'arktype',
      { readonly: true },
    )
    expect(result).toBe(
      `import{type}from'arktype'

export const UserSchema = type({name:"string"}).readonly()`,
    )
  })

  it.concurrent('should generate readonly schemas with effect (no change)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'effect',
      { readonly: true },
    )
    expect(result).toBe(
      `import{Schema}from'effect'

export const UserSchema = Schema.Struct({name:Schema.String})`,
    )
  })

  // --- readonly + exportTypes ---
  it.concurrent('should generate readonly schemas with exportTypes (zod)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'zod',
      { readonly: true, exportTypes: true },
    )
    expect(result).toBe(
      `import*as z from'zod'

export const UserSchema = z.object({name:z.string()}).readonly()

export type User = z.infer<typeof UserSchema>`,
    )
  })

  // --- readonly + multiple schemas ---
  it.concurrent('should generate readonly with multiple schemas (zod)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        Todo: {
          type: 'object',
          properties: { title: { type: 'string' } },
          required: ['title'],
        },
      },
      'zod',
      { readonly: true },
    )
    expect(result).toBe(
      `import*as z from'zod'

export const UserSchema = z.object({name:z.string()}).readonly()

export const TodoSchema = z.object({title:z.string()}).readonly()`,
    )
  })

  // --- readonly + description ---
  it.concurrent('should generate readonly with description (zod)', async () => {
    const result = await makeSchemasCode(
      {
        Pet: {
          type: 'object',
          description: 'A pet',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'zod',
      { readonly: true },
    )
    expect(result).toBe(
      `import*as z from'zod'

export const PetSchema = z.object({name:z.string()}).meta({description:"A pet"}).readonly()`,
    )
  })
})

describe('makeSplitSchemas', () => {
  const tmpDirs: string[] = []

  afterAll(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it.concurrent('should generate individual files per schema plus a barrel index', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'split-schemas-test-'))
    tmpDirs.push(tmpDir)

    const result = await makeSplitSchemas(
      {
        Pet: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        Owner: {
          type: 'object',
          properties: {
            pet: { $ref: '#/components/schemas/Pet' },
            name: { type: 'string' },
          },
          required: ['pet', 'name'],
        },
      },
      'zod',
      tmpDir,
    )

    expect(result).toStrictEqual({ ok: true, value: undefined })

    const files = fs.readdirSync(tmpDir).sort()
    expect(files).toStrictEqual(['index.ts', 'owner.ts', 'pet.ts'])

    const indexContent = fs.readFileSync(path.join(tmpDir, 'index.ts'), 'utf-8')
    expect(indexContent).toBe("export * from './owner'\nexport * from './pet'\n")

    const petContent = fs.readFileSync(path.join(tmpDir, 'pet.ts'), 'utf-8')
    expect(petContent).toBe(
      `import * as z from 'zod'

export const PetSchema = z.object({ name: z.string() })
`,
    )

    const ownerContent = fs.readFileSync(path.join(tmpDir, 'owner.ts'), 'utf-8')
    expect(ownerContent).toBe(
      `import * as z from 'zod'
import { PetSchema } from './pet'

export const OwnerSchema = z.object({ pet: PetSchema, name: z.string() })
`,
    )
  })

  it.concurrent('should generate split schemas with types when exportTypes is true (zod)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'split-schemas-types-zod-'))
    tmpDirs.push(tmpDir)

    const result = await makeSplitSchemas(
      {
        Pet: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'zod',
      tmpDir,
      { exportTypes: true },
    )

    expect(result).toStrictEqual({ ok: true, value: undefined })

    const petContent = fs.readFileSync(path.join(tmpDir, 'pet.ts'), 'utf-8')
    expect(petContent).toBe(
      `import * as z from 'zod'

export const PetSchema = z.object({ name: z.string() })

export type Pet = z.infer<typeof PetSchema>
`,
    )
  })

  it.concurrent('should generate split schemas with Encoded type when exportTypes is true (effect)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'split-schemas-types-effect-'))
    tmpDirs.push(tmpDir)

    const result = await makeSplitSchemas(
      {
        Pet: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'effect',
      tmpDir,
      { exportTypes: true },
    )

    expect(result).toStrictEqual({ ok: true, value: undefined })

    const petContent = fs.readFileSync(path.join(tmpDir, 'pet.ts'), 'utf-8')
    expect(petContent).toBe(
      `import { Schema } from 'effect'

export const PetSchema = Schema.Struct({ name: Schema.String })

export type Pet = typeof PetSchema.Encoded
`,
    )
  })

  it.concurrent('should add `import type { Static }` line for typebox split + exportTypes', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'split-schemas-types-typebox-'))
    tmpDirs.push(tmpDir)

    const result = await makeSplitSchemas(
      {
        Pet: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'typebox',
      tmpDir,
      { exportTypes: true },
    )

    expect(result).toStrictEqual({ ok: true, value: undefined })

    const petContent = fs.readFileSync(path.join(tmpDir, 'pet.ts'), 'utf-8')
    expect(petContent).toBe(
      `import Type from 'typebox'
import type { Static } from 'typebox'

export const PetSchema = Type.Object({ name: Type.String() })

export type Pet = Static<typeof PetSchema>
`,
    )
  })

  it.concurrent('should NOT add `import type { Static }` for typebox split when exportTypes is false', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'split-schemas-no-types-typebox-'))
    tmpDirs.push(tmpDir)

    const result = await makeSplitSchemas(
      {
        Pet: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      'typebox',
      tmpDir,
    )

    expect(result).toStrictEqual({ ok: true, value: undefined })

    const petContent = fs.readFileSync(path.join(tmpDir, 'pet.ts'), 'utf-8')
    expect(petContent).toBe(
      `import Type from 'typebox'

export const PetSchema = Type.Object({ name: Type.String() })
`,
    )
  })

  it.concurrent('split: deps are sorted alphabetically and import lines deduplicate by name', async () => {
    // Order in input is intentionally not alphabetical to ensure we sort.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'split-schemas-dep-sort-'))
    tmpDirs.push(tmpDir)

    const result = await makeSplitSchemas(
      {
        Beta: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
        Alpha: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
        Combined: {
          type: 'object',
          properties: {
            b: { $ref: '#/components/schemas/Beta' },
            a: { $ref: '#/components/schemas/Alpha' },
          },
          required: ['a', 'b'],
        },
      },
      'zod',
      tmpDir,
    )

    expect(result).toStrictEqual({ ok: true, value: undefined })

    const combined = fs.readFileSync(path.join(tmpDir, 'combined.ts'), 'utf-8')
    // Imports must be in alphabetical order — Alpha before Beta — regardless
    // of how the schema body references them.
    expect(combined).toBe(
      `import * as z from 'zod'
import { AlphaSchema } from './alpha'
import { BetaSchema } from './beta'

export const CombinedSchema = z.object({ b: BetaSchema, a: AlphaSchema })
`,
    )
  })

  // ============================================================
  // Regression: non-circular cross-component refs MUST unwrap the lazy
  // wrapper. Otherwise:
  //   - effect: `Schema.Array(Schema.suspend(() => UserSchema))` doesn't
  //     expose `~standard` → `resolver(...)` rejects it (TS2345)
  //   - valibot: `v.array(v.lazy(() => UserSchema))` keeps a wasteful
  //     thunk for no reason
  // Both should resolve to `Schema.Array(UserSchema)` / `v.array(UserSchema)`.
  // ============================================================
  it.concurrent('unwraps non-circular Schema.suspend refs (effect)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { id: { type: 'integer' }, name: { type: 'string' } },
          required: ['id', 'name'],
        },
        UserList: { type: 'array', items: { $ref: '#/components/schemas/User' } },
      },
      'effect',
    )
    // Direct identifier reference, no Schema.suspend wrapper
    expect(result.includes('Schema.Array(UserSchema)')).toBe(true)
    expect(result.includes('Schema.suspend(() => UserSchema)')).toBe(false)
  })

  it.concurrent('unwraps non-circular v.lazy refs (valibot)', async () => {
    const result = await makeSchemasCode(
      {
        User: {
          type: 'object',
          properties: { id: { type: 'integer' }, name: { type: 'string' } },
          required: ['id', 'name'],
        },
        UserList: { type: 'array', items: { $ref: '#/components/schemas/User' } },
      },
      'valibot',
    )
    expect(result.includes('v.array(UserSchema)')).toBe(true)
    expect(result.includes('v.lazy(() => UserSchema)')).toBe(false)
  })

  it.concurrent('keeps Schema.suspend wrapper for circular refs (effect)', async () => {
    // Self-referential schema — the lazy wrapper IS necessary to break
    // the cycle, so it must NOT be stripped.
    const result = await makeSchemasCode(
      {
        Node: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Node' },
            },
          },
          required: ['value'],
        },
      },
      'effect',
    )
    // Self-cycle: must retain Schema.suspend
    expect(result.includes('Schema.suspend(() => NodeSchema)')).toBe(true)
  })

  it.concurrent('keeps v.lazy wrapper for circular refs (valibot)', async () => {
    const result = await makeSchemasCode(
      {
        Node: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/Node' },
            },
          },
          required: ['value'],
        },
      },
      'valibot',
    )
    expect(result.includes('v.lazy(() => NodeSchema)')).toBe(true)
  })
})
