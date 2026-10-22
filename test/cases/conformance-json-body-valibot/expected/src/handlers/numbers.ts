import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { IdSchema, FieldsResponse } from '../components'

export const numbersHandler = new Hono().post(
  '/numbers',
  describeRoute({ operationId: 'numbers', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    v.partial(
      v.object({
        id: v.pipe(v.number(), v.integer()),
        unsigned: v.pipe(v.number(), v.integer()),
        ranged: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
        level: v.union([v.literal(1), v.literal(2)]),
        version: v.literal(5),
        cursor: v.optional(v.pipe(v.number(), v.integer()), 0),
        maybe: v.nullable(v.pipe(v.number(), v.integer())),
        ids: v.array(v.pipe(v.number(), v.integer())),
        small: v.pipe(v.number(), v.integer()),
        ref: IdSchema,
      }),
    ),
  ),
  (c) => {},
)
