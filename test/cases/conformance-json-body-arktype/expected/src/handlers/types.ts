import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const typesHandler = new Hono().post(
  '/types',
  describeRoute({ operationId: 'types', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    type({
      'either?': 'string',
      'flagged?': 'number | null',
      'bounded?': type('string >= 2'),
      'moment?': 'string.date.iso',
      'clock?': 'string',
      'inherited?': type({ 'constructor?': 'number.integer', 'name?': 'string' }),
      'labelled?': type({ '[string]': 'number.integer' }),
    }),
  ),
  (c) => {},
)
