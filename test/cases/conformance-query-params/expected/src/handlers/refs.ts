import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { NameSchema, FieldsResponse } from '../components'

export const refsHandler = new Hono().get(
  '/refs',
  describeRoute({ operationId: 'queryRefs', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      ref_int: z.coerce.number().int().min(0).exactOptional(),
      ref_big: z.coerce.bigint().pipe(z.int64()).exactOptional(),
      ref_num: z.coerce.number().exactOptional(),
      ref_bool: z.stringbool().exactOptional(),
      ref_enum: z.coerce
        .number()
        .pipe(z.union([z.literal(1), z.literal(2), z.literal(3)]))
        .exactOptional(),
      ref_str: NameSchema.exactOptional(),
      ref_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number().int()),
        )
        .exactOptional(),
      arr_ref: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number().int().min(0)),
        )
        .exactOptional(),
      allof_ref: z.coerce.number().int().min(0).meta({ description: 'A count.' }).exactOptional(),
      ref_ref: z.coerce.number().int().min(0).exactOptional(),
    }),
  ),
  (c) => {},
)
