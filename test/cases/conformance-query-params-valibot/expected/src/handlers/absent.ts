import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { CountSchema, FieldsResponse } from '../components'

export const absentHandler = new Hono().get(
  '/absent',
  describeRoute({ operationId: 'queryAbsent', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        empty_ok: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
        empty_def: v.optional(
          v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          '7',
        ),
        empty_str: v.string(),
        ref_def: v.optional(v.optional(CountSchema, 3), 3),
      }),
    ),
  ),
  (c) => {},
)
