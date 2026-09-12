import { describe, expect, it } from 'vite-plus/test'

import { collectFreeIdentifiers, wrapReferences } from './identifiers.js'

describe('wrapReferences', () => {
  it('wraps references only, never strings, object keys or member names', () => {
    expect(
      wrapReferences(
        'z.object({NodeSchema:z.array(NodeSchema).describe("NodeSchema"),next:x.NodeSchema,tag:TagSchema})',
        new Set(['NodeSchema']),
        (name) => `z.lazy(() => ${name})`,
      ),
    ).toBe(
      'z.object({NodeSchema:z.array(z.lazy(() => NodeSchema)).describe("NodeSchema"),next:x.NodeSchema,tag:TagSchema})',
    )
  })

  it('returns the expression unchanged without names', () => {
    expect(wrapReferences('NodeSchema', new Set(), (name) => `lazy(${name})`)).toBe('NodeSchema')
  })
})

describe('collectFreeIdentifiers', () => {
  it('excludes top-level declarations', () => {
    expect([
      ...collectFreeIdentifiers(
        'export const ASchema=z.object({b:BSchema})\n\nexport type A=z.infer<typeof ASchema>',
      ),
    ]).toStrictEqual(['z', 'BSchema'])
  })
})
