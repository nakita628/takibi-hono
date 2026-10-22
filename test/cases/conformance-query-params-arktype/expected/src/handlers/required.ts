import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'queryRequired', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      id: 'string.integer.parse',
      big: 'string.integer.parse',
      flag: type("'true' | 'false'").pipe((data) => data === 'true'),
      name: 'string',
      tags: 'string.integer.parse[]',
      'note?': 'string.integer.parse',
    }),
  ),
  (c) => {},
)
