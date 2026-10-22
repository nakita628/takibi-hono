import { describe, expect, it } from 'vite-plus/test'

import { collectFreeIdentifiers } from './identifiers.js'

describe('collectFreeIdentifiers', () => {
  it('excludes top-level declarations', () => {
    expect([
      ...collectFreeIdentifiers(
        'export const ASchema=z.object({b:BSchema})\n\nexport type A=z.infer<typeof ASchema>',
      ),
    ]).toStrictEqual(['z', 'BSchema'])
  })

  it('reads a shorthand property as a reference and a type member key as a name', () => {
    expect([
      ...collectFreeIdentifiers(
        'type T={Type?:Static}\n\nconst a={Codec,Type:Compile(x.Type)}\n\nconst b=a["Codec"]',
      ),
    ]).toStrictEqual(['Static', 'Codec', 'Compile', 'x'])
  })

  it('reads nothing inside a string, a template or a regular expression', () => {
    expect([
      ...collectFreeIdentifiers('const a=`${z} Hono`+"resolver"+/validator/u.source'),
    ]).toStrictEqual(['z'])
  })
})
