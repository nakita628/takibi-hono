import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const sharedHandler = new Hono().get(
  '/shared',
  describeRoute({ operationId: 'queryShared', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'filter?': type({ 'name?': 'string', 'age?': 'string.integer.parse' }),
      'sort?': type({ 'name?': 'string', 'dir?': "'asc' | 'desc'" }),
    }),
  ),
  (c) => {},
)
