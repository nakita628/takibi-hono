import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'queryOptional', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.preprocess(
      (val) =>
        typeof val === 'object' && val !== null && !Array.isArray(val)
          ? Object.assign(Object.create(null), val)
          : val,
      z.object({
        int_opt: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int())
          .exactOptional(),
        int64_opt: z.coerce.bigint().pipe(z.int64()).exactOptional(),
        num_opt: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/)
          .transform((val) => Number(val))
          .pipe(z.number())
          .exactOptional(),
        bool_opt: z.stringbool().exactOptional(),
        str_opt: z.string().exactOptional(),
        uuid_opt: z.uuid().exactOptional(),
        arr_opt: z
          .preprocess(
            (val) => (val === undefined || Array.isArray(val) ? val : [val]),
            z.array(
              z
                .string()
                .regex(/^-?(?:0|[1-9]\d*)$/)
                .transform((val) => Number(val))
                .pipe(z.number().int()),
            ),
          )
          .exactOptional(),
        'page-size': z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int())
          .exactOptional(),
        'filter[name]': z.string().exactOptional(),
        $top: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int())
          .exactOptional(),
        'user.id': z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int())
          .exactOptional(),
        'ids[]': z
          .preprocess(
            (val) => (val === undefined || Array.isArray(val) ? val : [val]),
            z.array(
              z
                .string()
                .regex(/^-?(?:0|[1-9]\d*)$/)
                .transform((val) => Number(val))
                .pipe(z.number().int()),
            ),
          )
          .exactOptional(),
        Int_Opt: z.string().exactOptional(),
        constructor: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int())
          .exactOptional(),
      }),
    ),
  ),
  (c) => {},
)
