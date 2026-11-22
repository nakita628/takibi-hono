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
        int_opt: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int())
          .exactOptional(),
        int64_opt: z.coerce.bigint().pipe(z.int64()).exactOptional(),
        bool_opt: z.stringbool().exactOptional(),
        str_opt: z.string().exactOptional(),
        ienum: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.union([z.literal(1), z.literal(2), z.literal(3)]))
          .exactOptional(),
        benum: z.stringbool().pipe(z.literal(true)).exactOptional(),
        iconst: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.literal(7))
          .exactOptional(),
        senum: z.enum(['asc', 'desc']).exactOptional(),
        ioneof: z
          .union([
            z
              .string()
              .regex(/^-?(?:0|[1-9]\d*)$/)
              .transform((val) => Number(val))
              .pipe(z.number().int()),
            z.literal('all'),
          ])
          .exactOptional(),
        range: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int().min(1).max(100))
          .exactOptional(),
        length: z.string().min(2).max(4).exactOptional(),
        pattern: z
          .string()
          .regex(/^[a-z]+-\d{1,3}$/)
          .exactOptional(),
        ref_int: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int().min(0))
          .exactOptional(),
        prefs: z
          .object({
            theme: z.string().exactOptional(),
            size: z
              .string()
              .regex(/^-?(?:0|[1-9]\d*)$/)
              .transform((val) => Number(val))
              .pipe(z.number().int())
              .exactOptional(),
          })
          .exactOptional(),
        obj: z
          .object({
            a: z
              .string()
              .regex(/^-?(?:0|[1-9]\d*)$/)
              .transform((val) => Number(val))
              .pipe(z.number().int())
              .exactOptional(),
            b: z.string().exactOptional(),
          })
          .exactOptional(),
        tx_lower: z.string().toLowerCase().exactOptional(),
        tx_email: z.string().toLowerCase().pipe(z.email()).exactOptional(),
        'session-id': z
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
        Int_Opt: z.string().exactOptional(),
        inull: z
          .preprocess(
            (val) => (val === 'null' ? null : val),
            z
              .string()
              .regex(/^-?(?:0|[1-9]\d*)$/)
              .transform((val) => Number(val))
              .pipe(z.number().int())
              .nullable(),
          )
          .exactOptional(),
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
