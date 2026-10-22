import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { CountSchema, FlagSchema, FieldsResponse } from '../components'

export const urlencodedHandler = new Hono().post(
  '/urlencoded',
  describeRoute({ operationId: 'urlencoded', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    v.partial(
      v.object({
        name: v.string(),
        age: v.pipe(v.number(), v.integer(), v.minValue(0)),
        ratio: v.number(),
        big: v.pipe(v.number(), v.integer()),
        active: v.boolean(),
        level: v.union([v.literal(1), v.literal(2)]),
        agreed: v.literal(true),
        limit: v.optional(v.pipe(v.number(), v.integer()), 20),
        count: CountSchema,
        flag: FlagSchema,
        tags: v.array(v.string()),
        ids: v.array(v.pipe(v.number(), v.integer())),
        moment: v.pipe(v.string(), v.isoTimestamp()),
        clock: v.pipe(v.string(), v.isoTimeSecond()),
        maybe: v.nullable(v.pipe(v.number(), v.integer())),
        label: v.nullable(v.string()),
        constructor: v.pipe(v.number(), v.integer()),
      }),
    ),
  ),
  (c) => {},
)
