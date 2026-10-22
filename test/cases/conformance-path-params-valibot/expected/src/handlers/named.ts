import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const namedHandler = new Hono().get(
  '/named/:user-id/:post_id',
  describeRoute({ operationId: 'namedParam', responses: { '200': FieldsResponse } }),
  validator(
    'param',
    v.object({
      'user-id': v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
      post_id: v.pipe(
        v.picklist(['true', 'false']),
        v.transform((input) => input === 'true'),
      ),
    }),
  ),
  (c) => {},
)
