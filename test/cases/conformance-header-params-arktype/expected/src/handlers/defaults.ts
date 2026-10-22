import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'headerDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    type({
      'x-int-def?': 'number.integer',
      'x-int64-def?': 'number.integer',
      'x-bool-def?': 'boolean',
      'x-str-def?': 'string',
    }),
  ),
  (c) => {},
)
