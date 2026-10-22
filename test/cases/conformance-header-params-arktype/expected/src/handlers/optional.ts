import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { CountSchema, FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'headerOptional', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    type({
      'x-int-opt?': 'number.integer',
      'x-int64-opt?': 'number.integer',
      'x-bool-opt?': 'boolean',
      'x-str-opt?': 'string',
      'x-ienum?': '1 | 2 | 3',
      'x-benum?': 'true',
      'x-iconst?': '7',
      'x-senum?': "'asc' | 'desc'",
      'x-ioneof?': "number.integer | 'all'",
      'x-range?': type('number.integer >= 1').and(type('number.integer <= 100')),
      'x-length?': type('2 <= string <= 4'),
      'x-pattern?': type('string').and(/^[a-z]+-\d{1,3}$/),
      'x-tx-lower?': type('string').pipe((data: string) => data.toLowerCase()),
      'x-tx-email?': type('string.email').pipe((data: string) => data.toLowerCase()),
      'x-ref-int?': CountSchema,
      'x-str-arr?': 'string[]',
      'x-obj?': type({ 'a?': 'number.integer', 'b?': 'string' }),
      'x-objx?': type({ 'a?': 'number.integer', 'b?': 'string' }),
      'X-Request-Id?': 'string.uuid',
      'X-Rate-Limit?': 'number.integer',
      'accept-version?': 'number.integer',
      'x_underscore?': 'number.integer',
      'x-inull?': 'number.integer | null',
      'constructor?': 'number.integer',
    }),
  ),
  (c) => {},
)
