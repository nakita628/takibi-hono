import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { CountSchema, FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'headerOptional', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    v.partial(
      v.object({
        'x-int-opt': v.pipe(v.number(), v.integer()),
        'x-int64-opt': v.pipe(v.number(), v.integer()),
        'x-bool-opt': v.boolean(),
        'x-str-opt': v.string(),
        'x-ienum': v.union([v.literal(1), v.literal(2), v.literal(3)]),
        'x-benum': v.literal(true),
        'x-iconst': v.literal(7),
        'x-senum': v.picklist(['asc', 'desc']),
        'x-ioneof': v.union([v.pipe(v.number(), v.integer()), v.literal('all')]),
        'x-range': v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
        'x-length': v.pipe(v.string(), v.minLength(2), v.maxLength(4)),
        'x-pattern': v.pipe(v.string(), v.regex(/^[a-z]+-\d{1,3}$/)),
        'x-tx-lower': v.pipe(v.string(), v.toLowerCase()),
        'x-tx-email': v.pipe(v.string(), v.toLowerCase(), v.email()),
        'x-ref-int': CountSchema,
        'x-str-arr': v.array(v.string()),
        'x-obj': v.partial(v.object({ a: v.pipe(v.number(), v.integer()), b: v.string() })),
        'x-objx': v.partial(v.object({ a: v.pipe(v.number(), v.integer()), b: v.string() })),
        'X-Request-Id': v.pipe(v.string(), v.uuid()),
        'X-Rate-Limit': v.pipe(v.number(), v.integer()),
        'accept-version': v.pipe(v.number(), v.integer()),
        x_underscore: v.pipe(v.number(), v.integer()),
        'x-inull': v.nullable(v.pipe(v.number(), v.integer())),
        constructor: v.pipe(v.number(), v.integer()),
      }),
    ),
  ),
  (c) => {},
)
