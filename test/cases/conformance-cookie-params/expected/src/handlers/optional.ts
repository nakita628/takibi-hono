import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { CountSchema, FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'cookieOptional', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    z.object({
      int_opt: z.int().exactOptional(),
      int64_opt: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.int64())
        .exactOptional(),
      bool_opt: z.boolean().exactOptional(),
      str_opt: z.string().exactOptional(),
      ienum: z.union([z.literal(1), z.literal(2), z.literal(3)]).exactOptional(),
      benum: z.literal(true).exactOptional(),
      iconst: z.literal(7).exactOptional(),
      senum: z.enum(['asc', 'desc']).exactOptional(),
      ioneof: z.xor([z.int(), z.literal('all')]).exactOptional(),
      range: z.int().min(1).max(100).exactOptional(),
      length: z.string().min(2).max(4).exactOptional(),
      pattern: z
        .string()
        .regex(/^[a-z]+-\d{1,3}$/)
        .exactOptional(),
      ref_int: CountSchema.exactOptional(),
      prefs: z
        .object({ theme: z.string().exactOptional(), size: z.int().exactOptional() })
        .exactOptional(),
      obj: z.object({ a: z.int().exactOptional(), b: z.string().exactOptional() }).exactOptional(),
      tx_lower: z.string().toLowerCase().exactOptional(),
      tx_email: z.string().toLowerCase().pipe(z.email()).exactOptional(),
      'session-id': z.int().exactOptional(),
      'user.id': z.int().exactOptional(),
      Int_Opt: z.string().exactOptional(),
      inull: z.int().nullable().exactOptional(),
      constructor: z.int().exactOptional(),
    }),
  ),
  (c) => {},
)
