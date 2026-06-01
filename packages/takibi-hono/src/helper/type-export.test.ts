import { describe, expect, it } from 'vite-plus/test'

import { makeTypeExport } from './type-export.js'

describe('makeTypeExport', () => {
  it.concurrent('zod: z.infer', () => {
    expect(makeTypeExport('FooSchema', 'Foo', 'zod')).toBe(
      'export type Foo=z.infer<typeof FooSchema>',
    )
  })

  it.concurrent('valibot: v.InferOutput', () => {
    expect(makeTypeExport('FooSchema', 'Foo', 'valibot')).toBe(
      'export type Foo=v.InferOutput<typeof FooSchema>',
    )
  })

  it.concurrent('effect: .Encoded', () => {
    expect(makeTypeExport('FooSchema', 'Foo', 'effect')).toBe(
      'export type Foo=typeof FooSchema.Encoded',
    )
  })

  it.concurrent('typebox: Static', () => {
    expect(makeTypeExport('FooSchema', 'Foo', 'typebox')).toBe(
      'export type Foo=Static<typeof FooSchema>',
    )
  })

  it.concurrent('arktype: .infer', () => {
    expect(makeTypeExport('FooSchema', 'Foo', 'arktype')).toBe(
      'export type Foo=typeof FooSchema.infer',
    )
  })

  it.concurrent('uses the given varName and typeName verbatim', () => {
    expect(makeTypeExport('UserParametersSchema', 'UserParameters', 'zod')).toBe(
      'export type UserParameters=z.infer<typeof UserParametersSchema>',
    )
  })
})
