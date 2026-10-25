import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { CountSchema, FlagSchema, FieldsResponse } from '../components'

export const urlencodedHandler = new Hono().post(
  '/urlencoded',
  describeRoute({ operationId: 'urlencoded', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    v.pipe(
      v.unknown(),
      v.transform((input) =>
        typeof input === 'object' && input !== null && !Array.isArray(input)
          ? Object.assign(Object.create(null), input)
          : input,
      ),
      v.object({
        name: v.optional(v.string()),
        age: v.optional(
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger(), v.minValue(0)),
        ),
        ratio: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.finite())),
        big: v.optional(
          v.pipe(
            v.string(),
            v.regex(/^-?\d+$/),
            v.transform((input) => BigInt(input)),
            v.minValue(-9223372036854775808n),
            v.maxValue(9223372036854775807n),
          ),
        ),
        active: v.optional(
          v.pipe(
            v.string(),
            v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
          ),
        ),
        level: v.optional(
          v.pipe(v.string(), v.transform(Number), v.union([v.literal(1), v.literal(2)])),
        ),
        agreed: v.optional(
          v.pipe(
            v.string(),
            v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
            v.literal(true),
          ),
        ),
        limit: v.optional(
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          '20',
        ),
        count: v.optional(CountSchema),
        flag: v.optional(FlagSchema),
        tags: v.optional(
          v.pipe(
            v.unknown(),
            v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
            v.array(v.string()),
          ),
        ),
        ids: v.optional(
          v.pipe(
            v.unknown(),
            v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
            v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
          ),
        ),
        moment: v.optional(
          v.pipe(
            v.string(),
            v.regex(
              /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
            ),
          ),
        ),
        clock: v.optional(
          v.pipe(
            v.string(),
            v.regex(
              /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
            ),
          ),
        ),
        maybe: v.optional(
          v.pipe(
            v.unknown(),
            v.transform((input) => (input === 'null' ? null : input)),
            v.nullable(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
          ),
        ),
        label: v.optional(v.nullable(v.string())),
        constructor: v.optional(
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
        ),
      }),
    ),
  ),
  (c) => {},
)
