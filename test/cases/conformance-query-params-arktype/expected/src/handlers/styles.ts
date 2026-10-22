import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const stylesHandler = new Hono().get(
  '/styles',
  describeRoute({ operationId: 'queryStyles', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'csv?': 'string.integer.parse[]',
      'pipes?': 'string.integer.parse[]',
      'spaces?': 'string.integer.parse[]',
      'filter?': type({ 'name?': 'string', 'age?': 'string.integer.parse' }),
      'csv_str?': 'string[]',
    }),
  ),
  (c) => {},
)
