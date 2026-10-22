import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'cookieDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    v.partial(
      v.object({
        int_def: v.optional(v.pipe(v.number(), v.integer()), 20),
        int64_def: v.optional(v.pipe(v.number(), v.integer()), 5),
        bool_def: v.optional(v.boolean(), false),
        str_def: v.optional(v.string(), 'fallback'),
      }),
    ),
  ),
  (c) => {},
)
