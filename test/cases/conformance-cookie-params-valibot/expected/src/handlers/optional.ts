import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { CountSchema, FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'cookieOptional', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    v.pipe(
      v.unknown(),
      v.transform((input) =>
        typeof input === 'object' && input !== null && !Array.isArray(input)
          ? Object.assign(Object.create(null), input)
          : input,
      ),
      v.partial(
        v.object({
          int_opt: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          int64_opt: v.pipe(
            v.string(),
            v.regex(/^-?\d+$/),
            v.transform((input) => BigInt(input)),
            v.minValue(-9223372036854775808n),
            v.maxValue(9223372036854775807n),
          ),
          bool_opt: v.pipe(
            v.string(),
            v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
          ),
          str_opt: v.string(),
          ienum: v.pipe(
            v.string(),
            v.transform(Number),
            v.union([v.literal(1), v.literal(2), v.literal(3)]),
          ),
          benum: v.pipe(
            v.string(),
            v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
            v.literal(true),
          ),
          iconst: v.pipe(v.string(), v.transform(Number), v.literal(7)),
          senum: v.picklist(['asc', 'desc']),
          ioneof: v.union([
            v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
            v.literal('all'),
          ]),
          range: v.pipe(
            v.string(),
            v.transform(Number),
            v.number(),
            v.safeInteger(),
            v.minValue(1),
            v.maxValue(100),
          ),
          length: v.pipe(v.string(), v.minCodePoints(2), v.maxCodePoints(4)),
          pattern: v.pipe(v.string(), v.regex(/^[a-z]+-\d{1,3}$/)),
          ref_int: CountSchema,
          prefs: v.partial(
            v.object({
              theme: v.string(),
              size: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
            }),
          ),
          obj: v.partial(
            v.object({
              a: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
              b: v.string(),
            }),
          ),
          tx_lower: v.pipe(v.string(), v.toLowerCase()),
          tx_email: v.pipe(v.string(), v.toLowerCase(), v.email()),
          'session-id': v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          'user.id': v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          Int_Opt: v.string(),
          inull: v.pipe(
            v.unknown(),
            v.transform((input) => (input === 'null' ? null : input)),
            v.nullable(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
          ),
          constructor: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
        }),
      ),
    ),
  ),
  (c) => {},
)
