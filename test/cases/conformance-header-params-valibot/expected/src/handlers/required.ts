import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'headerRequired', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    v.object({
      'x-id': v.pipe(v.number(), v.integer()),
      'x-big': v.pipe(v.number(), v.integer()),
      'x-flag': v.boolean(),
      'x-name': v.string(),
      'x-note': v.optional(v.pipe(v.number(), v.integer())),
    }),
  ),
  (c) => {},
)
