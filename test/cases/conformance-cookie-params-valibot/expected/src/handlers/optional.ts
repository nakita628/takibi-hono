import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { CountSchema, FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'cookieOptional', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    v.partial(
      v.object({
        int_opt: v.pipe(v.number(), v.integer()),
        int64_opt: v.pipe(
          v.union([
            v.bigint(),
            v.pipe(v.number(), v.integer()),
            v.pipe(v.string(), v.regex(/^-?\d+$/)),
          ]),
          v.transform((input) => BigInt(input)),
          v.minValue(-9223372036854775808n),
          v.maxValue(9223372036854775807n),
        ),
        bool_opt: v.boolean(),
        str_opt: v.string(),
        ienum: v.union([v.literal(1), v.literal(2), v.literal(3)]),
        benum: v.literal(true),
        iconst: v.literal(7),
        senum: v.picklist(['asc', 'desc']),
        ioneof: v.union([v.pipe(v.number(), v.integer()), v.literal('all')]),
        range: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
        length: v.pipe(v.string(), v.minCodePoints(2), v.maxCodePoints(4)),
        pattern: v.pipe(v.string(), v.regex(/^[a-z]+-\d{1,3}$/)),
        ref_int: CountSchema,
        prefs: v.partial(v.object({ theme: v.string(), size: v.pipe(v.number(), v.integer()) })),
        obj: v.partial(v.object({ a: v.pipe(v.number(), v.integer()), b: v.string() })),
        tx_lower: v.pipe(v.string(), v.toLowerCase()),
        tx_email: v.pipe(v.string(), v.toLowerCase(), v.email()),
        'session-id': v.pipe(v.number(), v.integer()),
        'user.id': v.pipe(v.number(), v.integer()),
        Int_Opt: v.string(),
        inull: v.nullable(v.pipe(v.number(), v.integer())),
        constructor: v.pipe(v.number(), v.integer()),
      }),
    ),
  ),
  (c) => {},
)
