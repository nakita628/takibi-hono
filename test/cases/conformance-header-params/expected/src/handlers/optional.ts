import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'headerOptional', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    z.preprocess(
      (val) =>
        typeof val === 'object' && val !== null && !Array.isArray(val)
          ? Object.assign(Object.create(null), val)
          : val,
      z.object({
        'x-int-opt': z.coerce.number().int().exactOptional(),
        'x-int64-opt': z.coerce.bigint().pipe(z.int64()).exactOptional(),
        'x-bool-opt': z.stringbool().exactOptional(),
        'x-str-opt': z.string().exactOptional(),
        'x-ienum': z.coerce
          .number()
          .pipe(z.union([z.literal(1), z.literal(2), z.literal(3)]))
          .exactOptional(),
        'x-benum': z.stringbool().pipe(z.literal(true)).exactOptional(),
        'x-iconst': z.coerce.number().pipe(z.literal(7)).exactOptional(),
        'x-senum': z.enum(['asc', 'desc']).exactOptional(),
        'x-ioneof': z.union([z.coerce.number().int(), z.literal('all')]).exactOptional(),
        'x-range': z.coerce.number().int().min(1).max(100).exactOptional(),
        'x-length': z.string().min(2).max(4).exactOptional(),
        'x-pattern': z
          .string()
          .regex(/^[a-z]+-\d{1,3}$/)
          .exactOptional(),
        'x-tx-lower': z.string().toLowerCase().exactOptional(),
        'x-tx-email': z.string().toLowerCase().pipe(z.email()).exactOptional(),
        'x-ref-int': z.coerce.number().int().min(0).exactOptional(),
        'x-str-arr': z
          .preprocess(
            (val) => (val === undefined || Array.isArray(val) ? val : [val]),
            z.array(z.string()),
          )
          .exactOptional(),
        'x-obj': z
          .object({ a: z.coerce.number().int().exactOptional(), b: z.string().exactOptional() })
          .exactOptional(),
        'x-objx': z
          .object({ a: z.coerce.number().int().exactOptional(), b: z.string().exactOptional() })
          .exactOptional(),
        'x-request-id': z.uuid().exactOptional(),
        'x-rate-limit': z.coerce.number().int().exactOptional(),
        'accept-version': z.coerce.number().int().exactOptional(),
        x_underscore: z.coerce.number().int().exactOptional(),
        'x-inull': z
          .preprocess((val) => (val === 'null' ? null : val), z.coerce.number().int().nullable())
          .exactOptional(),
        constructor: z.coerce.number().int().exactOptional(),
      }),
    ),
  ),
  (c) => {},
)
