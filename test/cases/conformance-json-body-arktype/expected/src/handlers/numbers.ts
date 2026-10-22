import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { IdSchema, FieldsResponse } from '../components'

export const numbersHandler = new Hono().post(
  '/numbers',
  describeRoute({ operationId: 'numbers', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    type({
      'id?': 'number.integer',
      'unsigned?': 'number.integer',
      'ranged?': type('number.integer >= 1').and(type('number.integer <= 100')),
      'level?': '1 | 2',
      'version?': '5',
      'cursor?': 'number.integer',
      'maybe?': 'number.integer | null',
      'ids?': 'number.integer[]',
      'small?': 'number.integer',
      'ref?': IdSchema,
    }),
  ),
  (c) => {},
)
