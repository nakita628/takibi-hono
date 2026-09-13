import { describe, expect, it } from 'vite-plus/test'

import { makeInlineAdapter } from '../helper/library.js'
import { makeComponentCode } from './components.js'

const components = {
  responses: {
    NotFound: {
      description: 'not found',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
    },
    Empty: { description: 'empty' },
  },
  parameters: { PageSize: { name: 'page-size', in: 'query', schema: { type: 'integer' } } },
  mediaTypes: {
    'text-plain': { schema: { type: 'string' } },
    Ref: { $ref: '#/components/mediaTypes/text-plain' },
  },
} as never

const zodResolver = makeInlineAdapter('zod', { resolver: true })

describe('makeComponentCode', () => {
  it('delegates to oas-truth declarations', () => {
    expect(
      makeComponentCode('responses', components, zodResolver, {
        exportTypes: false,
        readonly: true,
        split: false,
      }),
    ).toStrictEqual([
      {
        fileName: 'index',
        code: 'export const NotFoundResponse={description:"not found",content:{"application/json":{schema:resolver(ErrorSchema)}}} as const;export const EmptyResponse={description:"empty"} as const',
      },
    ])
  })

  it('yields one entry per component when split', () => {
    expect(
      makeComponentCode('responses', components, zodResolver, {
        exportTypes: false,
        readonly: false,
        split: true,
      }),
    ).toStrictEqual([
      {
        fileName: 'notFound',
        code: 'export const NotFoundResponse={description:"not found",content:{"application/json":{schema:resolver(ErrorSchema)}}}',
      },
      { fileName: 'empty', code: 'export const EmptyResponse={description:"empty"}' },
    ])
  })

  it('applies query coercion and type exports to parameters', () => {
    expect(
      makeComponentCode(
        'parameters',
        components,
        makeInlineAdapter('valibot', { resolver: false }),
        {
          exportTypes: true,
          readonly: false,
          split: false,
        },
      ),
    ).toStrictEqual([
      {
        fileName: 'index',
        code: 'export const PageSizeParamsSchema=v.pipe(v.string(),v.transform(Number),v.number(),v.integer())\n\nexport type PageSizeParamsSchema=v.InferOutput<typeof PageSizeParamsSchema>',
      },
    ])
  })

  it('builds mediaTypes, skipping references', () => {
    expect(
      makeComponentCode(
        'mediaTypes',
        components,
        makeInlineAdapter('effect', { resolver: false }),
        {
          exportTypes: true,
          readonly: false,
          split: false,
        },
      ),
    ).toStrictEqual([
      {
        fileName: 'index',
        code: 'export const TextPlainMediaTypeSchema=Schema.String\n\nexport type TextPlainMediaTypeSchema=Schema.Schema.Type<typeof TextPlainMediaTypeSchema>',
      },
    ])
  })

  it.each([false, true])('returns nothing for a missing kind (split: %s)', (split) => {
    expect(
      makeComponentCode('links', components, zodResolver, {
        exportTypes: false,
        readonly: false,
        split,
      }),
    ).toStrictEqual([])
  })
})
