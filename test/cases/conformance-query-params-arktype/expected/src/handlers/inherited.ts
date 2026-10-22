import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const inheritedHandler = new Hono().get(
  '/inherited',
  describeRoute({ operationId: 'queryInherited', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      toString: 'string',
      'valueOf?': 'string.integer.parse',
      'hasOwnProperty?': type("'true' | 'false'").pipe((data) => data === 'true'),
      'isPrototypeOf?': 'string.integer.parse[]',
      'toLocaleString?': 'string.integer.parse',
    }),
  ),
  (c) => {},
)
