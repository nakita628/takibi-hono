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
          v.integer(),
          v.minValue(1),
          v.maxValue(100),
        ),
        exclusive: v.pipe(v.string(), v.transform(Number), v.number(), v.gtValue(0), v.ltValue(1)),
        multiple: v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.multipleOf(5)),
        int64range: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.integer(),
          v.minValue(1),
          v.maxValue(100),
        ),
        length: v.pipe(v.string(), v.minLength(2), v.maxLength(4)),
        pattern: v.pipe(v.string(), v.regex(/^[a-z]+-\d{1,3}$/)),
        items: v.pipe(
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
          v.minLength(2),
          v.maxLength(3),
        ),
        unique: v.pipe(
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
          v.check((input) => new Set(input).size === input.length),
        ),
        ranged_items: v.array(
          v.pipe(
            v.string(),
            v.transform(Number),
            v.number(),
            v.integer(),
            v.minValue(1),
            v.maxValue(9),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
