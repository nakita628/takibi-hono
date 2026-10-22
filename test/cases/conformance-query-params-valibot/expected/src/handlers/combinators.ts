import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const combinatorsHandler = new Hono().get(
  '/combinators',
  describeRoute({ operationId: 'queryCombinators', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        allof: v.intersect([
          v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          v.any(),
        ]),
        allof_range: v.intersect([
          v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
          v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.maxValue(10)),
        ]),
        oneof_is: v.union([
          v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          v.string(),
        ]),
        oneof_ib: v.union([
          v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          v.pipe(
            v.picklist(['true', 'false']),
            v.transform((input) => input === 'true'),
          ),
        ]),
        anyof_ns: v.union([v.pipe(v.string(), v.transform(Number), v.number()), v.string()]),
        mixed: v.union([v.literal(1), v.literal('a'), v.literal('2')]),
        not_zero: v.custom<unknown>((input) => input !== 0),
        not_enum: v.custom<unknown>((input) => ![1, 2].some((item) => item === input)),
        not_string: v.custom<unknown>((input) => typeof input !== 'string'),
        typeless_min: v.any(),
        typeless_len: v.any(),
        nconst: v.literal(2),
        multi: v.string(),
        multi_nb: v.pipe(v.string(), v.transform(Number), v.number()),
        tuple: v.tuple([
          v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          v.string(),
        ]),
      }),
    ),
  ),
  (c) => {},
)
