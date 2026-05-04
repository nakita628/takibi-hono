import { describe, expect, it } from 'vite-plus/test'

import type { Schema } from '../openapi/index.js'
import { ast, detectCircularRefs, getLazyWrapper } from './ast.js'

describe('ast', () => {
  it.concurrent('should return code unchanged when no declarations', () => {
    expect(ast('')).toBe('')
  })

  it.concurrent('should sort independent declarations alphabetically by appearance', () => {
    const code = 'export const B = 1\n\nexport const A = 2'
    expect(ast(code)).toBe('export const B = 1\n\nexport const A = 2')
  })

  it.concurrent('should sort dependent declarations in dependency order', () => {
    const code = [
      'export const PostSchema = z.object({author:UserSchema})',
      'export const UserSchema = z.object({name:z.string()})',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export const UserSchema = z.object({name:z.string()})',
        'export const PostSchema = z.object({author:UserSchema})',
      ].join('\n\n'),
    )
  })

  it.concurrent('should handle type after const', () => {
    const code = [
      'export const UserSchema = z.object({name:z.string()})',
      'export type User = z.infer<typeof UserSchema>',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export const UserSchema = z.object({name:z.string()})',
        'export type User = z.infer<typeof UserSchema>',
      ].join('\n\n'),
    )
  })

  it.concurrent('should not reorder z.lazy schemas based on refs', () => {
    const code = [
      'export const CategorySchema = z.lazy(() => z.object({parent:CategorySchema}))',
      'export type Category = z.infer<typeof CategorySchema>',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export const CategorySchema = z.lazy(() => z.object({parent:CategorySchema}))',
        'export type Category = z.infer<typeof CategorySchema>',
      ].join('\n\n'),
    )
  })

  it.concurrent('should sort chain: C depends on B depends on A', () => {
    const code = [
      'export const C = z.intersection(A, B)',
      'export const A = z.string()',
      'export const B = z.object({a:A})',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export const A = z.string()',
        'export const B = z.object({a:A})',
        'export const C = z.intersection(A, B)',
      ].join('\n\n'),
    )
  })

  it.concurrent('should handle interface declarations', () => {
    const code = [
      'export interface UserProps { name: string }',
      'export const UserSchema = z.object({name:z.string()})',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export interface UserProps { name: string }',
        'export const UserSchema = z.object({name:z.string()})',
      ].join('\n\n'),
    )
  })

  it.concurrent('should sort interface that depends on type', () => {
    const code = [
      'export interface Extended extends Base { extra: string }',
      'export type Base = { id: number }',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export type Base = { id: number }',
        'export interface Extended extends Base { extra: string }',
      ].join('\n\n'),
    )
  })

  it.concurrent('should not reorder v.lazy schemas', () => {
    const code = [
      'export const TreeSchema = v.lazy(() => v.object({children:v.array(TreeSchema)}))',
      'export type Tree = v.InferOutput<typeof TreeSchema>',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export const TreeSchema = v.lazy(() => v.object({children:v.array(TreeSchema)}))',
        'export type Tree = v.InferOutput<typeof TreeSchema>',
      ].join('\n\n'),
    )
  })

  it.concurrent('should not reorder Schema.suspend schemas', () => {
    const code = [
      'export const NodeSchema = Schema.suspend(() => Schema.Struct({child:NodeSchema}))',
      'export type Node = typeof NodeSchema.Encoded',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export const NodeSchema = Schema.suspend(() => Schema.Struct({child:NodeSchema}))',
        'export type Node = typeof NodeSchema.Encoded',
      ].join('\n\n'),
    )
  })

  it.concurrent('should not reorder Type.Recursive schemas', () => {
    const code = [
      'export const CatSchema = Type.Recursive(This => Type.Object({parent:This}))',
      'export type Cat = Static<typeof CatSchema>',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export const CatSchema = Type.Recursive(This => Type.Object({parent:This}))',
        'export type Cat = Static<typeof CatSchema>',
      ].join('\n\n'),
    )
  })

  it.concurrent('should handle self-referencing type alias', () => {
    const code = [
      'export type CategoryType = {id:number;children?:CategoryType[]}',
      'export const CategorySchema:z.ZodType<CategoryType> = z.lazy(() => z.object({id:z.number(),children:z.array(CategorySchema).optional()}))',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export type CategoryType = {id:number;children?:CategoryType[]}',
        'export const CategorySchema:z.ZodType<CategoryType> = z.lazy(() => z.object({id:z.number(),children:z.array(CategorySchema).optional()}))',
      ].join('\n\n'),
    )
  })

  it.concurrent('should handle mixed const, type, and interface', () => {
    const code = [
      'export const ItemSchema = z.object({name:z.string()})',
      'export type Item = z.infer<typeof ItemSchema>',
      'export interface ItemInput { name: string }',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export const ItemSchema = z.object({name:z.string()})',
        'export type Item = z.infer<typeof ItemSchema>',
        'export interface ItemInput { name: string }',
      ].join('\n\n'),
    )
  })

  it.concurrent('should handle diamond dependency', () => {
    const code = [
      'export const D = z.object({b:B,c:C})',
      'export const C = z.object({a:A})',
      'export const B = z.object({a:A})',
      'export const A = z.string()',
    ].join('\n\n')
    const result = ast(code)
    const lines = result.split('\n\n')
    // A must come before B and C, B and C must come before D
    const indexOf = (name: string) => lines.findIndex((l) => l.includes(`const ${name} =`))
    expect(indexOf('A')).toBeLessThan(indexOf('B'))
    expect(indexOf('A')).toBeLessThan(indexOf('C'))
    expect(indexOf('B')).toBeLessThan(indexOf('D'))
    expect(indexOf('C')).toBeLessThan(indexOf('D'))
  })

  // =========================================================================
  // Robustness: circular dependencies, complex graphs, edge cases
  // =========================================================================

  it.concurrent('should terminate on circular dependency (A→B→A)', () => {
    const code = ['export const A = z.object({b:B})', 'export const B = z.object({a:A})'].join(
      '\n\n',
    )
    // Circular: A→B→A. topoSort breaks cycle via temp mark; both appear
    expect(ast(code)).toBe(
      ['export const B = z.object({a:A})', 'export const A = z.object({b:B})'].join('\n\n'),
    )
  })

  it.concurrent('should terminate on three-way circular dependency (A→B→C→A)', () => {
    const code = [
      'export const A = z.object({c:C})',
      'export const B = z.object({a:A})',
      'export const C = z.object({b:B})',
    ].join('\n\n')
    // Cycle broken via temp mark. Visit order: A→C→B (depth-first from A)
    expect(ast(code)).toBe(
      [
        'export const B = z.object({a:A})',
        'export const C = z.object({b:B})',
        'export const A = z.object({c:C})',
      ].join('\n\n'),
    )
  })

  it.concurrent('should handle same name as variable and type', () => {
    const code = [
      'export const UserSchema = z.object({name:z.string()})',
      'export type UserSchema = z.infer<typeof UserSchema>',
    ].join('\n\n')
    // const first, then type (type references const via typeof)
    expect(ast(code)).toBe(
      [
        'export const UserSchema = z.object({name:z.string()})',
        'export type UserSchema = z.infer<typeof UserSchema>',
      ].join('\n\n'),
    )
  })

  it.concurrent('should handle large dependency chain (A→B→C→D→E)', () => {
    const code = [
      'export const E = z.object({d:D})',
      'export const D = z.object({c:C})',
      'export const C = z.object({b:B})',
      'export const B = z.object({a:A})',
      'export const A = z.string()',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export const A = z.string()',
        'export const B = z.object({a:A})',
        'export const C = z.object({b:B})',
        'export const D = z.object({c:C})',
        'export const E = z.object({d:D})',
      ].join('\n\n'),
    )
  })

  it.concurrent('should handle declarations with no cross-references', () => {
    const code = [
      'export const Z = z.string()',
      'export const A = z.number()',
      'export const M = z.boolean()',
    ].join('\n\n')
    expect(ast(code)).toBe(code)
  })

  it.concurrent('should handle single declaration', () => {
    const code = 'export const OnlySchema = z.object({name:z.string()})'
    expect(ast(code)).toBe(code)
  })

  it.concurrent('should handle type referencing interface', () => {
    const code = [
      'export type Combined = BaseInterface & { extra: string }',
      'export interface BaseInterface { id: number }',
    ].join('\n\n')
    expect(ast(code)).toBe(
      [
        'export interface BaseInterface { id: number }',
        'export type Combined = BaseInterface & { extra: string }',
      ].join('\n\n'),
    )
  })

  it.concurrent('should handle z.lazy with external reference not causing false dep', () => {
    const code = [
      'export const TreeSchema = z.lazy(() => z.object({children:z.array(TreeSchema),owner:UserSchema}))',
      'export const UserSchema = z.object({name:z.string()})',
    ].join('\n\n')
    // z.lazy has no deps → TreeSchema stays before UserSchema (no reorder)
    expect(ast(code)).toBe(
      [
        'export const TreeSchema = z.lazy(() => z.object({children:z.array(TreeSchema),owner:UserSchema}))',
        'export const UserSchema = z.object({name:z.string()})',
      ].join('\n\n'),
    )
  })

  it.concurrent('should handle complex mixed graph with types and consts', () => {
    const code = [
      'export type PostType = {author:UserType;tags:TagType[]}',
      'export const TagSchema = z.object({name:z.string()})',
      'export type TagType = z.infer<typeof TagSchema>',
      'export const UserSchema = z.object({name:z.string()})',
      'export type UserType = z.infer<typeof UserSchema>',
      'export const PostSchema = z.object({author:UserSchema,tags:z.array(TagSchema)})',
    ].join('\n\n')
    // Visit order from decls array: PostType first, resolves deps depth-first
    // UserSchema/UserType and TagSchema/TagType are independent subgraphs
    expect(ast(code)).toBe(
      [
        'export const UserSchema = z.object({name:z.string()})',
        'export type UserType = z.infer<typeof UserSchema>',
        'export const TagSchema = z.object({name:z.string()})',
        'export type TagType = z.infer<typeof TagSchema>',
        'export type PostType = {author:UserType;tags:TagType[]}',
        'export const PostSchema = z.object({author:UserSchema,tags:z.array(TagSchema)})',
      ].join('\n\n'),
    )
  })
})

describe('detectCircularRefs', () => {
  it.concurrent('should return empty set for non-circular schemas', () => {
    const schemas: { [k: string]: Schema } = {
      User: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
        },
      },
      Post: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          author: { $ref: '#/components/schemas/User' },
        },
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.size).toBe(0)
  })

  it.concurrent('should detect self-referencing schema', () => {
    const schemas: { [k: string]: Schema } = {
      TreeNode: {
        type: 'object',
        properties: {
          value: { type: 'string' },
          children: {
            type: 'array',
            items: { $ref: '#/components/schemas/TreeNode' },
          },
        },
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.has('TreeNode')).toBe(true)
    expect(result.size).toBe(1)
  })

  it.concurrent('should detect mutual circular references', () => {
    const schemas: { [k: string]: Schema } = {
      A: {
        type: 'object',
        properties: {
          b: { $ref: '#/components/schemas/B' },
        },
      },
      B: {
        type: 'object',
        properties: {
          a: { $ref: '#/components/schemas/A' },
        },
      },
      C: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.has('A')).toBe(true)
    expect(result.has('B')).toBe(true)
    expect(result.has('C')).toBe(false)
    expect(result.size).toBe(2)
  })

  it.concurrent('should detect circular through nested properties', () => {
    const schemas: { [k: string]: Schema } = {
      Parent: {
        type: 'object',
        properties: {
          child: { $ref: '#/components/schemas/Child' },
        },
      },
      Child: {
        type: 'object',
        properties: {
          parent: { $ref: '#/components/schemas/Parent' },
          sibling: { $ref: '#/components/schemas/Sibling' },
        },
      },
      Sibling: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.has('Parent')).toBe(true)
    expect(result.has('Child')).toBe(true)
    expect(result.has('Sibling')).toBe(false)
  })

  it.concurrent('should detect circular through allOf', () => {
    const schemas: { [k: string]: Schema } = {
      Base: {
        allOf: [{ $ref: '#/components/schemas/Extended' }],
      },
      Extended: {
        allOf: [{ $ref: '#/components/schemas/Base' }],
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.has('Base')).toBe(true)
    expect(result.has('Extended')).toBe(true)
  })

  it.concurrent('should detect circular through oneOf', () => {
    const schemas: { [k: string]: Schema } = {
      Expr: {
        oneOf: [{ $ref: '#/components/schemas/Literal' }, { $ref: '#/components/schemas/Unary' }],
      },
      Literal: { type: 'object', properties: { value: { type: 'string' } } },
      Unary: {
        type: 'object',
        properties: {
          operand: { $ref: '#/components/schemas/Expr' },
        },
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.has('Expr')).toBe(true)
    expect(result.has('Unary')).toBe(true)
    expect(result.has('Literal')).toBe(false)
  })

  it.concurrent('should detect circular through anyOf', () => {
    const schemas: { [k: string]: Schema } = {
      Node: {
        type: 'object',
        properties: {
          children: {
            anyOf: [{ $ref: '#/components/schemas/Node' }, { type: 'string' }],
          },
        },
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.has('Node')).toBe(true)
    expect(result.size).toBe(1)
  })

  it.concurrent('should detect circular through additionalProperties', () => {
    const schemas: { [k: string]: Schema } = {
      Tree: {
        type: 'object',
        additionalProperties: { $ref: '#/components/schemas/Tree' },
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.has('Tree')).toBe(true)
  })

  it.concurrent('should return empty set for empty schema map', () => {
    const result = detectCircularRefs({})
    expect(result.size).toBe(0)
  })

  it.concurrent('should ignore refs to non-existent schemas', () => {
    const schemas: { [k: string]: Schema } = {
      A: {
        type: 'object',
        properties: {
          ghost: { $ref: '#/components/schemas/DoesNotExist' },
        },
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.size).toBe(0)
  })

  it.concurrent('should detect self-reference through not keyword', () => {
    const schemas: { [k: string]: Schema } = {
      Exclusive: {
        type: 'object',
        properties: {
          value: { type: 'string' },
        },
        not: { $ref: '#/components/schemas/Exclusive' },
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.has('Exclusive')).toBe(true)
    expect(result.size).toBe(1)
  })

  it.concurrent('should detect circular through deep nesting (properties > items > $ref)', () => {
    const schemas: { [k: string]: Schema } = {
      Category: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          subcategories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                parent: { $ref: '#/components/schemas/Category' },
              },
            },
          },
        },
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.has('Category')).toBe(true)
    expect(result.size).toBe(1)
  })

  it.concurrent('should detect circular through tuple items', () => {
    const schemas: { [k: string]: Schema } = {
      Pair: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: [{ type: 'string' }, { $ref: '#/components/schemas/Pair' }] as unknown as Schema,
          },
        },
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.has('Pair')).toBe(true)
    expect(result.size).toBe(1)
  })

  it.concurrent('should detect circular through additionalProperties + allOf', () => {
    const schemas: { [k: string]: Schema } = {
      Config: {
        allOf: [
          {
            type: 'object',
            additionalProperties: { $ref: '#/components/schemas/Config' },
          },
        ],
      },
    }
    const result = detectCircularRefs(schemas)
    expect(result.has('Config')).toBe(true)
    expect(result.size).toBe(1)
  })

  it.concurrent('should detect 3-way circular (A→B→C→A)', () => {
    const schemas: { [k: string]: Schema } = {
      A: { type: 'object', properties: { b: { $ref: '#/components/schemas/B' } } },
      B: { type: 'object', properties: { c: { $ref: '#/components/schemas/C' } } },
      C: { type: 'object', properties: { a: { $ref: '#/components/schemas/A' } } },
      D: { type: 'object', properties: { name: { type: 'string' } } },
    }
    const result = detectCircularRefs(schemas)
    expect(result).toStrictEqual(new Set(['A', 'B', 'C']))
  })
})

describe('getLazyWrapper', () => {
  it.concurrent('should return correct wrapper for zod', () => {
    const wrapper = getLazyWrapper('zod')
    expect(wrapper.open).toBe('z.lazy(() => ')
    expect(wrapper.close).toBe(')')
  })

  it.concurrent('should return correct wrapper for valibot', () => {
    const wrapper = getLazyWrapper('valibot')
    expect(wrapper.open).toBe('v.lazy(() => ')
    expect(wrapper.close).toBe(')')
  })

  it.concurrent('should return correct wrapper for typebox', () => {
    const wrapper = getLazyWrapper('typebox')
    expect(wrapper.open).toBe('Type.Recursive(This => ')
    expect(wrapper.close).toBe(')')
  })

  it.concurrent('should return empty wrapper for arktype', () => {
    const wrapper = getLazyWrapper('arktype')
    expect(wrapper.open).toBe('')
    expect(wrapper.close).toBe('')
  })

  it.concurrent('should return correct wrapper for effect', () => {
    const wrapper = getLazyWrapper('effect')
    expect(wrapper.open).toBe('Schema.suspend(() => ')
    expect(wrapper.close).toBe(')')
  })

  it.concurrent('should return empty wrapper for unknown library', () => {
    const wrapper = getLazyWrapper('unknown')
    expect(wrapper).toStrictEqual({ open: '', close: '' })
  })
})
