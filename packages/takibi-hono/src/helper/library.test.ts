import { describe, expect, it } from 'vite-plus/test'

import { getLibrary, makeInlineAdapter } from './library.js'

describe('typebox withRef', () => {
  const { withRef } = getLibrary('typebox')

  it.each([
    ['Type.Object({a:Type.String()})', 'Type.Object({a:Type.String()},{ref:"X"})'],
    [
      'Type.Object({a:Type.String()},{description:"d"})',
      'Type.Object({a:Type.String()},{ref:"X",description:"d"})',
    ],
    ['Type.String()', 'Type.String({ref:"X"})'],
    ['Type.String({minLength:1})', 'Type.String({ref:"X",minLength:1})'],
    ['Type.Record(Type.String(),Type.Any())', 'Type.Record(Type.String(),Type.Any(),{ref:"X"})'],
    ["Type.Cyclic({X:Type.Any()},'X')", 'Type.Cyclic({X:Type.Any()},\'X\',{ref:"X"})'],
    [
      'Type.Readonly(Type.Object({a:Type.String()}))',
      'Type.Readonly(Type.Object({a:Type.String()},{ref:"X"}))',
    ],
    ['TagSchema', 'TagSchema'],
  ])('%s', (expr, expected) => {
    expect(withRef(expr, 'X')).toBe(expected)
  })
})

describe('makeInlineAdapter', () => {
  it('drops code-injection x-* keys from inline schemas', () => {
    expect(
      makeInlineAdapter('zod', { resolver: false }).toExpression({
        type: 'string',
        'x-refine': '(v) => globalThis.process.exit(1)',
      }),
    ).toBe('z.string()')
  })

  it('unwraps Effect lazy references', () => {
    expect(
      makeInlineAdapter('effect', { resolver: false }).toExpression({
        type: 'array',
        items: { $ref: '#/components/schemas/User' },
      }),
    ).toBe('Schema.Array(UserSchema)')
  })

  it.each([
    ['zod', false, undefined],
    ['zod', true, 'resolver(X)'],
    ['typebox', true, 'resolver(Compile(X))'],
    ['effect', true, 'resolver(Schema.toStandardSchemaV1(X))'],
  ] as const)('%s with resolver %s wraps schema slots as %s', (lib, resolver, expected) => {
    expect(makeInlineAdapter(lib, { resolver }).wrapSchema?.('X')).toBe(expected)
  })
})
