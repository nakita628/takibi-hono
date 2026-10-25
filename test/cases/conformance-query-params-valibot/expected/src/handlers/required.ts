import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'queryRequired', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.object({
      id: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
      big: v.pipe(
        v.string(),
        v.regex(/^-?\d+$/),
        v.transform((input) => BigInt(input)),
        v.minValue(-9223372036854775808n),
        v.maxValue(9223372036854775807n),
      ),
      flag: v.pipe(
        v.string(),
        v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
        v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
      ),
      name: v.string(),
      tags: v.pipe(
        v.unknown(),
        v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
        v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
      ),
      note: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
    }),
  ),
  (c) => {},
)
