import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const typesHandler = new Hono().post(
  '/types',
  describeRoute({ operationId: 'types', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    v.partial(
      v.object({
        either: v.union([v.pipe(v.number(), v.integer()), v.string()]),
        flagged: v.nullable(v.union([v.number(), v.boolean()])),
        bounded: v.union([
          v.pipe(v.number(), v.integer(), v.minValue(1)),
          v.pipe(v.string(), v.minCodePoints(2)),
        ]),
        moment: v.pipe(
          v.string(),
          v.regex(
            /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
          ),
        ),
        clock: v.pipe(
          v.string(),
          v.regex(
            /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
          ),
        ),
        inherited: v.partial(
          v.object({ constructor: v.pipe(v.number(), v.integer()), name: v.string() }),
        ),
        labelled: v.record(v.string(), v.pipe(v.number(), v.integer())),
      }),
    ),
  ),
  (c) => {},
)
