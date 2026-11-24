import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const limitsHandler = new Hono().get(
  '/limits',
  describeRoute({ operationId: 'queryLimits', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      range: z
        .preprocess(
          (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
          z.number().int().min(1).max(100),
        )
        .exactOptional(),
      exclusive: z
        .preprocess(
          (val) =>
            typeof val === 'string' && /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(val)
              ? Number(val)
              : val,
          z.number().gt(0).lt(1),
        )
        .exactOptional(),
      multiple: z
        .preprocess(
          (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
          z.number().int().multipleOf(5),
        )
        .exactOptional(),
      int64range: z.coerce.bigint().pipe(z.int64().min(1n).max(100n)).exactOptional(),
      length: z.string().min(2).max(4).exactOptional(),
      pattern: z
        .string()
        .regex(/^[a-z]+-\d{1,3}$/)
        .exactOptional(),
      items: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z
            .array(
              z.preprocess(
                (val) =>
                  typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
                z.number().int(),
              ),
            )
            .min(2)
            .max(3),
        )
        .exactOptional(),
      unique: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z
            .array(
              z.preprocess(
                (val) =>
                  typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
                z.number().int(),
              ),
            )
            .refine((val) => new Set(val).size === val.length),
        )
        .exactOptional(),
      ranged_items: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(
            z.preprocess(
              (val) =>
                typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
              z.number().int().min(1).max(9),
            ),
          ),
        )
        .exactOptional(),
    }),
  ),
  (c) => {},
)
