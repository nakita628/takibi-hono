import { describe, expect, it } from 'vite-plus/test'

import { hasOuterMeta, injectRef } from './inject-ref.js'

describe('hasOuterMeta', () => {
  it.concurrent('returns false for plain object schema', () => {
    expect(hasOuterMeta({ type: 'object', properties: { id: { type: 'integer' } } })).toBe(false)
  })

  it.concurrent('returns true when description is set', () => {
    expect(hasOuterMeta({ type: 'object', description: 'A user' })).toBe(true)
  })

  it.concurrent('returns true when example (singular) is set', () => {
    expect(hasOuterMeta({ type: 'object', example: { id: 1 } })).toBe(true)
  })

  it.concurrent('returns true when examples (plural) is set', () => {
    expect(hasOuterMeta({ type: 'object', examples: [{ id: 1 }] } as never)).toBe(true)
  })

  it.concurrent('returns true when deprecated is true', () => {
    expect(hasOuterMeta({ type: 'object', deprecated: true })).toBe(true)
  })

  it.concurrent('returns false when deprecated is false', () => {
    expect(hasOuterMeta({ type: 'object', deprecated: false })).toBe(false)
  })

  it.concurrent('returns false when description is empty string', () => {
    // Falsy values intentionally don't trigger registration.
    expect(hasOuterMeta({ type: 'object', description: '' })).toBe(false)
  })
})

describe('injectRef: zod', () => {
  it.concurrent('merges ref into existing .meta({...})', () => {
    const decl = `export const UserSchema = z.object({id:z.int()}).meta({description:"A user"})`
    expect(injectRef(decl, 'User', 'zod', true)).toBe(
      `export const UserSchema = z.object({id:z.int()}).meta({ref:"User",description:"A user"})`,
    )
  })

  it.concurrent('appends .meta({ref}) when no existing meta', () => {
    const decl = `export const UserSchema = z.object({id:z.int()})`
    expect(injectRef(decl, 'User', 'zod', false)).toBe(
      `export const UserSchema = z.object({id:z.int()}).meta({ref:"User"})`,
    )
  })

  it.concurrent('targets only the OUTER .meta — property-level meta untouched', () => {
    // The inner `.meta({description:"id"})` on the property must not receive ref.
    const decl = `export const UserSchema = z.object({id:z.int().meta({description:"id"}),name:z.string()}).meta({description:"A user"})`
    expect(injectRef(decl, 'User', 'zod', true)).toBe(
      `export const UserSchema = z.object({id:z.int().meta({description:"id"}),name:z.string()}).meta({ref:"User",description:"A user"})`,
    )
  })

  it.concurrent('preserves the trailing `export type ...` tail', () => {
    const decl = `export const UserSchema = z.object({id:z.int()})\n\nexport type User = z.infer<typeof UserSchema>`
    expect(injectRef(decl, 'User', 'zod', false)).toBe(
      `export const UserSchema = z.object({id:z.int()}).meta({ref:"User"})\n\nexport type User = z.infer<typeof UserSchema>`,
    )
  })

  it.concurrent('JSON.stringify-quotes names containing special chars', () => {
    const decl = `export const FooSchema = z.object({})`
    expect(injectRef(decl, 'Foo"Bar', 'zod', false)).toBe(
      `export const FooSchema = z.object({}).meta({ref:"Foo\\"Bar"})`,
    )
  })
})

describe('injectRef: valibot', () => {
  it.concurrent('merges ref into existing v.metadata({...})', () => {
    const decl = `export const UserSchema = v.pipe(v.object({id:v.number()}),v.metadata({examples:[{id:1}]}))`
    expect(injectRef(decl, 'User', 'valibot', true)).toBe(
      `export const UserSchema = v.pipe(v.object({id:v.number()}),v.metadata({ref:"User",examples:[{id:1}]}))`,
    )
  })

  it.concurrent('extends existing v.pipe by appending v.metadata when none exists', () => {
    const decl = `export const UserSchema = v.pipe(v.object({id:v.number()}),v.description("A user"))`
    expect(injectRef(decl, 'User', 'valibot', true)).toBe(
      `export const UserSchema = v.pipe(v.object({id:v.number()}),v.description("A user"),v.metadata({ref:"User"}))`,
    )
  })

  it.concurrent('wraps a non-piped expression in v.pipe', () => {
    const decl = `export const UserSchema = v.object({id:v.number()})`
    expect(injectRef(decl, 'User', 'valibot', false)).toBe(
      `export const UserSchema = v.pipe(v.object({id:v.number()}),v.metadata({ref:"User"}))`,
    )
  })
})

describe('injectRef: effect', () => {
  it.concurrent('merges identifier into existing .annotations({...})', () => {
    const decl = `export const UserSchema = Schema.Struct({id:Schema.Number}).annotations({description:"A user"})`
    expect(injectRef(decl, 'User', 'effect', true)).toBe(
      `export const UserSchema = Schema.Struct({id:Schema.Number}).annotations({identifier:"User",description:"A user"})`,
    )
  })

  it.concurrent('appends .annotations({identifier}) when no existing annotations', () => {
    const decl = `export const UserSchema = Schema.Struct({id:Schema.Number})`
    expect(injectRef(decl, 'User', 'effect', false)).toBe(
      `export const UserSchema = Schema.Struct({id:Schema.Number}).annotations({identifier:"User"})`,
    )
  })
})

describe('injectRef: typebox', () => {
  it.concurrent('merges ref into existing options when hasMeta is true', () => {
    const decl = `export const UserSchema = Type.Object({id:Type.Integer()},{description:"A user"})`
    expect(injectRef(decl, 'User', 'typebox', true)).toBe(
      `export const UserSchema = Type.Object({id:Type.Integer()},{ref:"User",description:"A user"})`,
    )
  })

  it.concurrent('attaches a fresh options arg when hasMeta is false', () => {
    const decl = `export const UserSchema = Type.Object({id:Type.Integer()})`
    expect(injectRef(decl, 'User', 'typebox', false)).toBe(
      `export const UserSchema = Type.Object({id:Type.Integer()},{ref:"User"})`,
    )
  })

  it.concurrent('targets only the OUTER `,{` — nested options untouched', () => {
    // The inner Type.Integer({description:"id"}) creates a `,{` boundary too;
    // we must inject only into the OUTER Type.Object's opts.
    const decl = `export const UserSchema = Type.Object({id:Type.Integer({description:"id"})},{description:"A user"})`
    expect(injectRef(decl, 'User', 'typebox', true)).toBe(
      `export const UserSchema = Type.Object({id:Type.Integer({description:"id"})},{ref:"User",description:"A user"})`,
    )
  })
})

describe('injectRef: arktype', () => {
  it.concurrent('appends .configure({ref}) regardless of describe presence', () => {
    const decl = `export const UserSchema = type({id:"number.integer"}).describe("A user")`
    expect(injectRef(decl, 'User', 'arktype', true)).toBe(
      `export const UserSchema = type({id:"number.integer"}).describe("A user").configure({ref:"User"})`,
    )
  })

  it.concurrent('appends .configure({ref}) on bare type() expression', () => {
    const decl = `export const UserSchema = type({id:"number.integer"})`
    expect(injectRef(decl, 'User', 'arktype', false)).toBe(
      `export const UserSchema = type({id:"number.integer"}).configure({ref:"User"})`,
    )
  })
})
