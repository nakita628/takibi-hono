import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const limitsHandler = new Hono().get(
  '/limits',
  describeRoute({ operationId: 'queryLimits', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        range: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.safeInteger(),
          v.minValue(1),
          v.maxValue(100),
        ),
        exclusive: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.finite(),
          v.gtValue(0),
          v.ltValue(1),
        ),
        multiple: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.safeInteger(),
          v.multipleOf(5),
        ),
        int64range: v.pipe(
          v.string(),
          v.regex(/^-?\d+$/),
          v.transform((input) => BigInt(input)),
          v.minValue(-9223372036854775808n),
          v.maxValue(9223372036854775807n),
          v.minValue(1n),
          v.maxValue(100n),
        ),
        length: v.pipe(v.string(), v.minCodePoints(2), v.maxCodePoints(4)),
        pattern: v.pipe(v.string(), v.regex(/^[a-z]+-\d{1,3}$/)),
        items: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
          v.minLength(2),
          v.maxLength(3),
        ),
        unique: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
          v.check((input) => new Set(input).size === input.length),
        ),
        ranged_items: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.transform(Number),
              v.number(),
              v.safeInteger(),
              v.minValue(1),
              v.maxValue(9),
            ),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
