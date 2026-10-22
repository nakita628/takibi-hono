import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const combinatorsHandler = new Hono().get(
  '/combinators',
  describeRoute({ operationId: 'queryCombinators', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'allof?': 'string.integer.parse & unknown',
      'allof_range?': type(type('string.integer.parse').to('number.integer >= 1')).and(
        type('string.integer.parse').to('number.integer <= 10'),
      ),
      'oneof_is?': 'string.integer.parse | string',
      'oneof_ib?': type('string.integer.parse').or(
        type("'true' | 'false'").pipe((data) => data === 'true'),
      ),
      'anyof_ns?': 'string.numeric.parse | string',
      'mixed?': "1 | 'a' | '2'",
      'not_zero?': type('unknown').narrow((data: unknown) => data !== 0),
      'not_enum?': type('unknown').narrow((data: unknown) => ![1, 2].includes(data as never)),
      'not_string?': type('unknown').narrow((data: unknown) => typeof data !== 'string'),
      'typeless_min?': 'unknown',
      'typeless_len?': 'unknown',
      'nconst?': '2',
      'multi?': 'string',
      'multi_nb?': 'string.numeric.parse',
      'tuple?': type(['string.integer.parse', 'string']),
    }),
  ),
  (c) => {},
)
