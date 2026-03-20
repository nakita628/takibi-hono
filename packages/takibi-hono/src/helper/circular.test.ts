import { describe, expect, it } from 'vite-plus/test'

import type { Schema } from '../openapi/index.js'
import { detectCircularRefs, getLazyWrapper } from './circular.js'

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
