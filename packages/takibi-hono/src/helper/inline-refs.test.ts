import { describe, expect, it } from 'vite-plus/test'

import { serializeWithRefs } from './inline-refs.js'

describe('serializeWithRefs', () => {
  it.concurrent('passes through plain objects unchanged', () => {
    expect(serializeWithRefs({ a: 1, b: 'x' })).toBe('{"a":1,"b":"x"}')
  })

  it.concurrent('inlines schema $ref to identifier', () => {
    expect(serializeWithRefs({ schema: { $ref: '#/components/schemas/User' } })).toBe(
      '{"schema":UserSchema}',
    )
  })

  it.concurrent('inlines response $ref', () => {
    expect(serializeWithRefs({ '200': { $ref: '#/components/responses/UserList' } })).toBe(
      '{"200":UserListResponse}',
    )
  })

  it.concurrent('inlines requestBody $ref', () => {
    expect(serializeWithRefs({ requestBody: { $ref: '#/components/requestBodies/Create' } })).toBe(
      '{"requestBody":CreateRequestBody}',
    )
  })

  it.concurrent('inlines parameter $ref to ParamsSchema', () => {
    expect(serializeWithRefs({ parameters: [{ $ref: '#/components/parameters/UserId' }] })).toBe(
      '{"parameters":[UserIdParamsSchema]}',
    )
  })

  it.concurrent('inlines header $ref', () => {
    expect(
      serializeWithRefs({ headers: { 'X-Token': { $ref: '#/components/headers/XToken' } } }),
    ).toBe('{"headers":{"X-Token":XTokenHeaderSchema}}')
  })

  it.concurrent('inlines mediaType $ref', () => {
    expect(serializeWithRefs({ schema: { $ref: '#/components/mediaTypes/Json' } })).toBe(
      '{"schema":JsonMediaTypeSchema}',
    )
  })

  it.concurrent('inlines multiple $refs in same object', () => {
    expect(
      serializeWithRefs({
        a: { $ref: '#/components/schemas/A' },
        b: { $ref: '#/components/schemas/B' },
      }),
    ).toBe('{"a":ASchema,"b":BSchema}')
  })

  it.concurrent('preserves non-component $refs', () => {
    // External or unknown $refs fall back to the last segment via resolveRef
    const out = serializeWithRefs({ schema: { $ref: 'external.yaml#/X' } })
    expect(out).toBe('{"schema":{"$ref":"external.yaml#/X"}}')
  })
})
