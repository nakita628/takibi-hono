import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'headerDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    v.object({
      'x-int-def': v.optional(
        v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
        '20',
      ),
      'x-int64-def': v.optional(
        v.pipe(
          v.string(),
          v.regex(/^-?\d+$/),
          v.transform((input) => BigInt(input)),
          v.minValue(-9223372036854775808n),
          v.maxValue(9223372036854775807n),
        ),
        '5',
      ),
      'x-bool-def': v.optional(
        v.pipe(
          v.string(),
          v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
          v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
        ),
        'false',
      ),
      'x-str-def': v.optional(v.string(), 'fallback'),
    }),
  ),
  (c) => {},
)
