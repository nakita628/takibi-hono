import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'queryDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.object({
      int_def: v.optional(
        v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
        '20',
      ),
      int64_def: v.optional(
        v.pipe(
          v.string(),
          v.regex(/^-?\d+$/),
          v.transform((input) => BigInt(input)),
          v.minValue(-9223372036854775808n),
          v.maxValue(9223372036854775807n),
        ),
        '5',
      ),
      num_def: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.finite()), '0.5'),
      bool_def: v.optional(
        v.pipe(
          v.string(),
          v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
          v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
        ),
        'false',
      ),
      bool_def_true: v.optional(
        v.pipe(
          v.string(),
          v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
          v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
        ),
        'true',
      ),
      str_def: v.optional(v.string(), 'fallback'),
      enum_def: v.optional(v.picklist(['asc', 'desc']), 'asc'),
      arr_def: v.optional(
        v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.string()),
        ),
        [],
      ),
      arr_int_def: v.optional(
        v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
        ),
        ['1', '2'],
      ),
    }),
  ),
  (c) => {},
)
