import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'headerRequired', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    type({
      'x-id': 'number.integer',
      'x-big': 'number.integer',
      'x-flag': 'boolean',
      'x-name': 'string',
      'x-note?': 'number.integer',
    }),
  ),
  (c) => {},
)
