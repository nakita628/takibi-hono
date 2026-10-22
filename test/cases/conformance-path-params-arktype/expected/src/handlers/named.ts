import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const namedHandler = new Hono().get(
  '/named/:user-id/:post_id',
  describeRoute({ operationId: 'namedParam', responses: { '200': FieldsResponse } }),
  validator(
    'param',
    type({
      'user-id': 'string.integer.parse',
      post_id: type("'true' | 'false'").pipe((data) => data === 'true'),
    }),
  ),
  (c) => {},
)
