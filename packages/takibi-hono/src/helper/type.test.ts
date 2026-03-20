import { describe, expect, it } from 'vite-plus/test'

import { makeTypeString, zodType } from './type.js'

describe('zodType', () => {
  it.concurrent('should generate type for simple object', () => {
    expect(
      zodType(
        {
          type: 'object',
          properties: { name: { type: 'string' }, age: { type: 'integer' } },
          required: ['name'],
        },
        'User',
      ),
    ).toBe('type UserType={name:string;age?:number}')
  })

  it.concurrent('should generate type for self-referencing schema', () => {
    expect(
      zodType(
        {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            children: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
          },
          required: ['id'],
        },
        'Category',
        new Set(['Category']),
      ),
    ).toBe('type CategoryType={id:number;children?:CategoryType[]}')
  })

  it.concurrent('should generate record type for additionalProperties', () => {
    expect(
      zodType(
        { type: 'object', additionalProperties: { type: 'string' } },
        'Map',
        new Set(['Map']),
      ),
    ).toBe('type MapType = {[key:string]:string}')
  })

  it.concurrent('should handle nullable type', () => {
    expect(
      zodType(
        {
          type: 'object',
          properties: { name: { type: 'string', nullable: true } },
          required: ['name'],
        },
        'User',
      ),
    ).toBe('type UserType={name:(string|null)}')
  })

  it.concurrent('should handle enum', () => {
    expect(
      zodType(
        {
          type: 'object',
          properties: { status: { enum: ['active', 'inactive'] } },
          required: ['status'],
        },
        'Item',
      ),
    ).toBe("type ItemType={status:'active'|'inactive'}")
  })
})

describe('makeTypeString', () => {
  it.concurrent('string', () => {
    expect(makeTypeString({ type: 'string' }, 'T')).toBe('string')
  })

  it.concurrent('number', () => {
    expect(makeTypeString({ type: 'number' }, 'T')).toBe('number')
  })

  it.concurrent('integer', () => {
    expect(makeTypeString({ type: 'integer' }, 'T')).toBe('number')
  })

  it.concurrent('boolean', () => {
    expect(makeTypeString({ type: 'boolean' }, 'T')).toBe('boolean')
  })

  it.concurrent('array of strings', () => {
    expect(makeTypeString({ type: 'array', items: { type: 'string' } }, 'T')).toBe('string[]')
  })

  it.concurrent('array of $ref (self)', () => {
    expect(
      makeTypeString({ type: 'array', items: { $ref: '#/components/schemas/Node' } }, 'Node'),
    ).toBe('NodeType[]')
  })

  it.concurrent('array of $ref (other)', () => {
    expect(
      makeTypeString({ type: 'array', items: { $ref: '#/components/schemas/Post' } }, 'User'),
    ).toBe('z.infer<typeof PostSchema>[]')
  })

  it.concurrent('object with properties', () => {
    expect(
      makeTypeString(
        { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] },
        'T',
      ),
    ).toBe('{id:number}')
  })

  it.concurrent('object with optional property', () => {
    expect(makeTypeString({ type: 'object', properties: { name: { type: 'string' } } }, 'T')).toBe(
      '{name?:string}',
    )
  })

  it.concurrent('$ref to self', () => {
    expect(makeTypeString({ $ref: '#/components/schemas/Node' }, 'Node')).toBe('NodeType')
  })

  it.concurrent('$ref to other', () => {
    expect(makeTypeString({ $ref: '#/components/schemas/User' }, 'Post')).toBe(
      'z.infer<typeof UserSchema>',
    )
  })

  it.concurrent('oneOf', () => {
    expect(makeTypeString({ oneOf: [{ type: 'string' }, { type: 'number' }] }, 'T')).toBe(
      '(string|number)',
    )
  })

  it.concurrent('allOf', () => {
    expect(
      makeTypeString(
        {
          allOf: [
            { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
            { type: 'object', properties: { b: { type: 'number' } }, required: ['b'] },
          ],
        },
        'T',
      ),
    ).toBe('({a:string}&{b:number})')
  })

  it.concurrent('const string', () => {
    expect(makeTypeString({ const: 'hello' }, 'T')).toBe("'hello'")
  })

  it.concurrent('const number', () => {
    expect(makeTypeString({ const: 42 }, 'T')).toBe('42')
  })

  it.concurrent('readonly array', () => {
    expect(makeTypeString({ type: 'array', items: { type: 'string' } }, 'T', undefined, true)).toBe(
      'readonly string[]',
    )
  })

  it.concurrent('readonly object', () => {
    expect(
      makeTypeString(
        { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
        'T',
        undefined,
        true,
      ),
    ).toBe('{readonly id:number}')
  })

  it.concurrent('unknown for undefined schema', () => {
    expect(makeTypeString(undefined as any, 'T')).toBe('unknown')
  })

  it.concurrent('anyOf union', () => {
    expect(makeTypeString({ anyOf: [{ type: 'string' }, { type: 'number' }] }, 'T')).toBe(
      '(string|number)',
    )
  })

  it.concurrent('type array union string|number', () => {
    expect(makeTypeString({ type: ['string', 'number'] }, 'T')).toBe('string|number')
  })

  it.concurrent('type array nullable string|null', () => {
    expect(makeTypeString({ type: ['string', 'null'] }, 'T')).toBe('(string|null)')
  })

  it.concurrent('tuple array with multiple items', () => {
    expect(
      makeTypeString(
        { type: 'array', items: [{ type: 'string' }, { type: 'number' }] as any },
        'T',
      ),
    ).toBe('[string,number]')
  })

  it.concurrent('tuple array with single item', () => {
    expect(makeTypeString({ type: 'array', items: [{ type: 'string' }] as any }, 'T')).toBe(
      'string[]',
    )
  })

  it.concurrent('tuple array with empty items array', () => {
    expect(makeTypeString({ type: 'array', items: [] as any }, 'T')).toBe('unknown[]')
  })

  it.concurrent('additionalProperties true no properties', () => {
    expect(makeTypeString({ type: 'object', additionalProperties: true }, 'T')).toBe(
      '{[key:string]:unknown}',
    )
  })

  it.concurrent('additionalProperties object with existing properties', () => {
    expect(
      makeTypeString(
        {
          type: 'object',
          properties: { id: { type: 'integer' } },
          required: ['id'],
          additionalProperties: { type: 'string' },
        },
        'T',
      ),
    ).toBe('{id:number}')
  })

  it.concurrent('$ref to property path (other parent)', () => {
    expect(makeTypeString({ $ref: '#/components/schemas/Foo/properties/bar' }, 'Baz')).toBe(
      'z.infer<typeof FooSchema>',
    )
  })

  it.concurrent('$ref to property path (self parent)', () => {
    expect(makeTypeString({ $ref: '#/components/schemas/Foo/properties/bar' }, 'Foo')).toBe(
      'FooType',
    )
  })

  it.concurrent('array items $ref to property path (other parent)', () => {
    expect(
      makeTypeString(
        { type: 'array', items: { $ref: '#/components/schemas/Foo/properties/bar' } },
        'Baz',
      ),
    ).toBe('z.infer<typeof FooSchema>[]')
  })

  it.concurrent('array items $ref to property path (self parent)', () => {
    expect(
      makeTypeString(
        { type: 'array', items: { $ref: '#/components/schemas/Foo/properties/bar' } },
        'Foo',
      ),
    ).toBe('FooType[]')
  })

  it.concurrent('readonly nested array wraps inner readonly', () => {
    expect(
      makeTypeString(
        { type: 'array', items: { type: 'array', items: { type: 'string' } } },
        'T',
        undefined,
        true,
      ),
    ).toBe('readonly (readonly string[])[]')
  })

  it.concurrent('unknown type returns unknown', () => {
    expect(makeTypeString({ type: 'file' as any }, 'T')).toBe('unknown')
  })

  it.concurrent('object no properties no additionalProperties', () => {
    expect(makeTypeString({ type: 'object' }, 'T')).toBe('{[key:string]:unknown}')
  })

  it.concurrent('additionalProperties object no properties', () => {
    expect(makeTypeString({ type: 'object', additionalProperties: { type: 'number' } }, 'T')).toBe(
      '{[key:string]:number}',
    )
  })

  it.concurrent('readonly tuple array with multiple items', () => {
    expect(
      makeTypeString(
        { type: 'array', items: [{ type: 'string' }, { type: 'number' }] as any },
        'T',
        undefined,
        true,
      ),
    ).toBe('readonly [string,number]')
  })

  it.concurrent('array without items', () => {
    expect(makeTypeString({ type: 'array' }, 'T')).toBe('unknown[]')
  })

  it.concurrent('readonly array without items', () => {
    expect(makeTypeString({ type: 'array' }, 'T', undefined, true)).toBe('readonly unknown[]')
  })

  it.concurrent('readonly additionalProperties true no properties', () => {
    expect(
      makeTypeString({ type: 'object', additionalProperties: true }, 'T', undefined, true),
    ).toBe('{readonly [key:string]:unknown}')
  })
})

describe('zodType additional', () => {
  it.concurrent('readonly flag passed to zodType', () => {
    expect(
      zodType(
        {
          type: 'object',
          properties: { tags: { type: 'array', items: { type: 'string' } } },
          required: ['tags'],
        },
        'Item',
        undefined,
        true,
      ),
    ).toBe('type ItemType={readonly tags:readonly string[]}')
  })

  it.concurrent('empty cyclic group does not trigger record path', () => {
    expect(
      zodType(
        {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        'Foo',
        new Set(),
      ),
    ).toBe('type FooType={name:string}')
  })

  it.concurrent('cyclic group with additionalProperties true triggers record', () => {
    expect(zodType({ type: 'object', additionalProperties: true }, 'Map', new Set(['Map']))).toBe(
      'type MapType = {[key:string]:{[key:string]:unknown}}',
    )
  })
})
