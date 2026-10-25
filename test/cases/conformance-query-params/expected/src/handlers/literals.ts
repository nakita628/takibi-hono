import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const literalsHandler = new Hono().get(
  '/literals',
  describeRoute({ operationId: 'queryLiterals', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      ienum: z.coerce
        .number()
        .pipe(z.union([z.literal(1), z.literal(2), z.literal(3)]))
        .exactOptional(),
      nenum: z.coerce
        .number()
        .pipe(z.union([z.literal(1.5), z.literal(2.5)]))
        .exactOptional(),
      benum: z.stringbool().pipe(z.literal(true)).exactOptional(),
      iconst: z.coerce.number().pipe(z.literal(7)).exactOptional(),
      senum: z.enum(['asc', 'desc']).exactOptional(),
      sconst: z.literal('fixed').exactOptional(),
      numericsenum: z.enum(['1', '02', 'true']).exactOptional(),
      inull: z
        .preprocess((val) => (val === 'null' ? null : val), z.coerce.number().int().nullable())
        .exactOptional(),
      bnull: z
        .preprocess((val) => (val === 'null' ? null : val), z.stringbool().nullable())
        .exactOptional(),
      nullof: z
        .preprocess(
          (val) => (val === 'null' ? null : val),
          z
            .union([
              z.coerce.number().int(),
              z.preprocess((val) => (val === 'null' ? null : val), z.null().nullable()),
            ])
            .nullable(),
        )
        .exactOptional(),
      inull_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(
            z.preprocess(
              (val) => (val === 'null' ? null : val),
              z.coerce.number().int().nullable(),
            ),
          ),
        )
        .exactOptional(),
      inull_list: z
        .preprocess(
          (val) => (val === 'null' ? null : val),
          z
            .preprocess(
              (val) => (val === undefined || Array.isArray(val) ? val : [val]),
              z.array(z.coerce.number().int()),
            )
            .nullable(),
        )
        .exactOptional(),
      snull: z.string().nullable().exactOptional(),
      ioneof: z.union([z.coerce.number().int(), z.literal('all')]).exactOptional(),
      ienum_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number().pipe(z.union([z.literal(1), z.literal(2), z.literal(3)]))),
        )
        .exactOptional(),
      senum_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.enum(['asc', 'desc'])),
        )
        .exactOptional(),
    }),
  ),
  (c) => {},
)
