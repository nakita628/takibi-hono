import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'headerDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    v.partial(
      v.object({
        'x-int-def': v.optional(v.pipe(v.number(), v.integer()), 20),
        'x-int64-def': v.optional(v.pipe(v.number(), v.integer()), 5),
        'x-bool-def': v.optional(v.boolean(), false),
        'x-str-def': v.optional(v.string(), 'fallback'),
      }),
    ),
  ),
  (c) => {},
)
