import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'cookieRequired', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    v.object({
      id: v.pipe(v.number(), v.integer()),
      big: v.pipe(v.number(), v.integer()),
      flag: v.boolean(),
      name: v.string(),
      note: v.optional(v.pipe(v.number(), v.integer())),
    }),
  ),
  (c) => {},
)
