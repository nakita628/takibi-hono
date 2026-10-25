import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { CountSchema, FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'headerOptional', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    z.object({
      'x-int-opt': z.int().exactOptional(),
      'x-int64-opt': z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.int64())
        .exactOptional(),
      'x-bool-opt': z.boolean().exactOptional(),
      'x-str-opt': z.string().exactOptional(),
      'x-ienum': z.union([z.literal(1), z.literal(2), z.literal(3)]).exactOptional(),
      'x-benum': z.literal(true).exactOptional(),
      'x-iconst': z.literal(7).exactOptional(),
      'x-senum': z.enum(['asc', 'desc']).exactOptional(),
      'x-ioneof': z.xor([z.int(), z.literal('all')]).exactOptional(),
      'x-range': z.int().min(1).max(100).exactOptional(),
      'x-length': z.string().min(2).max(4).exactOptional(),
      'x-pattern': z
        .string()
        .regex(/^[a-z]+-\d{1,3}$/)
        .exactOptional(),
      'x-tx-lower': z.string().toLowerCase().exactOptional(),
      'x-tx-email': z.string().toLowerCase().pipe(z.email()).exactOptional(),
      'x-ref-int': CountSchema.exactOptional(),
      'x-str-arr': z.array(z.string()).exactOptional(),
      'x-obj': z
        .object({ a: z.int().exactOptional(), b: z.string().exactOptional() })
        .exactOptional(),
      'x-objx': z
        .object({ a: z.int().exactOptional(), b: z.string().exactOptional() })
        .exactOptional(),
      'X-Request-Id': z.uuid().exactOptional(),
      'X-Rate-Limit': z.int().exactOptional(),
      'accept-version': z.int().exactOptional(),
      x_underscore: z.int().exactOptional(),
      'x-inull': z.int().nullable().exactOptional(),
      constructor: z.int().exactOptional(),
    }),
  ),
  (c) => {},
)
