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
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          v.pipe(v.string(), v.transform(Number), v.number(), v.finite(), v.minValue(5)),
        ]),
        allof_range: v.intersect([
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger(), v.minValue(1)),
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger(), v.maxValue(10)),
        ]),
        oneof_is: v.union([
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          v.string(),
        ]),
        oneof_ib: v.union([
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          v.pipe(
            v.string(),
            v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
          ),
        ]),
        anyof_ns: v.union([
          v.pipe(v.string(), v.transform(Number), v.number(), v.finite()),
          v.string(),
        ]),
        mixed: v.union([v.literal(1), v.literal('a'), v.literal('2')]),
        not_zero: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.safeInteger(),
          v.check((input) => input !== 0),
        ),
        not_enum: v.custom<unknown>((input) => ![1, 2].some((item) => item === input)),
        not_string: v.custom<unknown>((input) => typeof input !== 'string'),
        typeless_min: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.finite(),
          v.minValue(1),
        ),
        typeless_len: v.pipe(v.string(), v.minCodePoints(3)),
        nconst: v.pipe(v.string(), v.transform(Number), v.literal(2)),
        multi: v.union([
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          v.string(),
        ]),
        multi_nb: v.union([
          v.pipe(v.string(), v.transform(Number), v.number(), v.finite()),
          v.pipe(
            v.string(),
            v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
          ),
        ]),
        tuple: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.tuple([
            v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
            v.string(),
          ]),
        ),
      }),
    ),
  ),
  (c) => {},
)
