import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { NameSchema, FieldsResponse } from '../components'

export const refsHandler = new Hono().get(
  '/refs',
  describeRoute({ operationId: 'queryRefs', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        ref_int: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.safeInteger(),
          v.minValue(0),
        ),
        ref_big: v.pipe(
          v.string(),
          v.regex(/^-?\d+$/),
          v.transform((input) => BigInt(input)),
          v.minValue(-9223372036854775808n),
          v.maxValue(9223372036854775807n),
        ),
        ref_num: v.pipe(v.string(), v.transform(Number), v.number(), v.finite()),
        ref_bool: v.pipe(
          v.string(),
          v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
          v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
        ),
        ref_enum: v.pipe(
          v.string(),
          v.transform(Number),
          v.union([v.literal(1), v.literal(2), v.literal(3)]),
        ),
        ref_str: NameSchema,
        ref_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
        ),
        arr_ref: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger(), v.minValue(0)),
          ),
        ),
        allof_ref: v.pipe(
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger(), v.minValue(0)),
          v.description('A count.'),
        ),
        ref_ref: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.safeInteger(),
          v.minValue(0),
        ),
      }),
    ),
  ),
  (c) => {},
)
