import { describe, expect, it } from 'vite-plus/test'

import { makeInlineAdapter } from './library.js'

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

  it('wraps only the requested slots when slots is set', () => {
    const adapter = makeInlineAdapter('zod', { resolver: true, slots: ['response-content'] })
    expect(adapter.wrapSchema?.('X', 'response-content')).toBe('resolver(X)')
    expect(adapter.wrapSchema?.('X', 'header')).toBe('X')
  })
})
