import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'cookieOptional', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    z.preprocess(
      (val) =>
        typeof val === 'object' && val !== null && !Array.isArray(val)
          ? Object.assign(Object.create(null), val)
          : val,
      z.object({
        int_opt: z.coerce.number().int().exactOptional(),
        int64_opt: z.coerce.bigint().pipe(z.int64()).exactOptional(),
        bool_opt: z.stringbool().exactOptional(),
        str_opt: z.string().exactOptional(),
        ienum: z.coerce
          .number()
          .pipe(z.union([z.literal(1), z.literal(2), z.literal(3)]))
          .exactOptional(),
        benum: z.stringbool().pipe(z.literal(true)).exactOptional(),
        iconst: z.coerce.number().pipe(z.literal(7)).exactOptional(),
        senum: z.enum(['asc', 'desc']).exactOptional(),
        ioneof: z.union([z.coerce.number().int(), z.literal('all')]).exactOptional(),
        range: z.coerce.number().int().min(1).max(100).exactOptional(),
        length: z.string().min(2).max(4).exactOptional(),
        pattern: z
          .string()
          .regex(/^[a-z]+-\d{1,3}$/)
          .exactOptional(),
        ref_int: z.coerce.number().int().min(0).exactOptional(),
        prefs: z
          .object({
            theme: z.string().exactOptional(),
            size: z.coerce.number().int().exactOptional(),
          })
          .exactOptional(),
        obj: z
          .object({ a: z.coerce.number().int().exactOptional(), b: z.string().exactOptional() })
          .exactOptional(),
        tx_lower: z.string().toLowerCase().exactOptional(),
        tx_email: z.string().toLowerCase().pipe(z.email()).exactOptional(),
        'session-id': z.coerce.number().int().exactOptional(),
        'user.id': z.coerce.number().int().exactOptional(),
        Int_Opt: z.string().exactOptional(),
        inull: z
          .preprocess((val) => (val === 'null' ? null : val), z.coerce.number().int().nullable())
          .exactOptional(),
        constructor: z.coerce.number().int().exactOptional(),
      }),
    ),
  ),
  (c) => {},
)
