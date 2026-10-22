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
      allof: z.intersection(z.coerce.number().int(), z.any()).exactOptional(),
      allof_range: z
        .intersection(z.coerce.number().int().min(1), z.coerce.number().int().max(10))
        .exactOptional(),
      oneof_is: z.xor([z.coerce.number().int(), z.string()]).exactOptional(),
      oneof_ib: z.xor([z.coerce.number().int(), z.stringbool()]).exactOptional(),
      anyof_ns: z.union([z.coerce.number(), z.string()]).exactOptional(),
      mixed: z.union([z.literal(1), z.literal('a'), z.literal('2')]).exactOptional(),
      not_zero: z
        .any()
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
      typeless_min: z.any().exactOptional(),
      typeless_len: z.any().exactOptional(),
      nconst: z.literal(2).exactOptional(),
      multi: z.string().exactOptional(),
      multi_nb: z.coerce.number().exactOptional(),
      tuple: z.tuple([z.coerce.number().int(), z.string()]).exactOptional(),
    }),
  ),
  (c) => {},
)
