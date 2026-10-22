import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'cookieRequired', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    type({
      id: 'number.integer',
      big: 'number.integer',
      flag: 'boolean',
      name: 'string',
      'note?': 'number.integer',
    }),
  ),
  (c) => {},
)
