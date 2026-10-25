import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { CountSchema, FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'headerOptional', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    v.pipe(
      v.unknown(),
      v.transform((input) =>
        typeof input === 'object' && input !== null && !Array.isArray(input)
          ? Object.assign(Object.create(null), input)
          : input,
      ),
      v.partial(
        v.object({
          'x-int-opt': v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          'x-int64-opt': v.pipe(
            v.string(),
            v.regex(/^-?\d+$/),
            v.transform((input) => BigInt(input)),
            v.minValue(-9223372036854775808n),
            v.maxValue(9223372036854775807n),
          ),
          'x-bool-opt': v.pipe(
            v.string(),
            v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
          ),
          'x-str-opt': v.string(),
          'x-ienum': v.pipe(
            v.string(),
            v.transform(Number),
            v.union([v.literal(1), v.literal(2), v.literal(3)]),
          ),
          'x-benum': v.pipe(
            v.string(),
            v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
            v.literal(true),
          ),
          'x-iconst': v.pipe(v.string(), v.transform(Number), v.literal(7)),
          'x-senum': v.picklist(['asc', 'desc']),
          'x-ioneof': v.union([
            v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
            v.literal('all'),
          ]),
          'x-range': v.pipe(
            v.string(),
            v.transform(Number),
            v.number(),
            v.safeInteger(),
            v.minValue(1),
            v.maxValue(100),
          ),
          'x-length': v.pipe(v.string(), v.minCodePoints(2), v.maxCodePoints(4)),
          'x-pattern': v.pipe(v.string(), v.regex(/^[a-z]+-\d{1,3}$/)),
          'x-tx-lower': v.pipe(v.string(), v.toLowerCase()),
          'x-tx-email': v.pipe(v.string(), v.toLowerCase(), v.email()),
          'x-ref-int': CountSchema,
          'x-str-arr': v.pipe(
            v.unknown(),
            v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
            v.array(v.string()),
          ),
          'x-obj': v.partial(
            v.object({
              a: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
              b: v.string(),
            }),
          ),
          'x-objx': v.partial(
            v.object({
              a: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
              b: v.string(),
            }),
          ),
          'x-request-id': v.pipe(
            v.string(),
            v.regex(
              /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
            ),
          ),
          'x-rate-limit': v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          'accept-version': v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          x_underscore: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          'x-inull': v.pipe(
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
