import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const combinatorsHandler = new Hono().get(
  '/combinators',
  describeRoute({ operationId: 'queryCombinators', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      allof: z.intersection(z.coerce.number().int(), z.coerce.number().min(5)).exactOptional(),
      allof_range: z
        .intersection(z.coerce.number().int().min(1), z.coerce.number().int().max(10))
        .exactOptional(),
      oneof_is: z.union([z.coerce.number().int(), z.string()]).exactOptional(),
      oneof_ib: z.union([z.coerce.number().int(), z.stringbool()]).exactOptional(),
      anyof_ns: z.union([z.coerce.number(), z.string()]).exactOptional(),
      mixed: z.union([z.literal(1), z.literal('a'), z.literal('2')]).exactOptional(),
      not_zero: z.coerce
        .number()
        .int()
        .refine((val) => val !== 0)
        .exactOptional(),
      not_enum: z
        .any()
        .refine((val) => ![1, 2].includes(val))
        .exactOptional(),
      not_string: z
        .any()
        .refine((val) => typeof val !== 'string')
        .exactOptional(),
      typeless_min: z.coerce.number().min(1).exactOptional(),
      typeless_len: z.string().min(3).exactOptional(),
      nconst: z.coerce.number().pipe(z.literal(2)).exactOptional(),
      multi: z.union([z.coerce.number().int(), z.string()]).exactOptional(),
      multi_nb: z.union([z.coerce.number(), z.stringbool()]).exactOptional(),
      tuple: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.tuple([z.coerce.number().int(), z.string()]),
        )
        .exactOptional(),
    }),
  ),
  (c) => {},
)
