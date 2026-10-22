import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'cookieDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    type({
      'int_def?': 'number.integer',
      'int64_def?': 'number.integer',
      'bool_def?': 'boolean',
      'str_def?': 'string',
    }),
  ),
  (c) => {},
)
