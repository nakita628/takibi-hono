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
      'x-int64-opt?': type('bigint | number.integer')
        .or(/^-?\d+$/)
        .pipe((data) => BigInt(data))
        .narrow(
          (data, ctx) =>
            (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
            ctx.mustBe('an int64'),
        ),
      'x-bool-opt?': 'boolean',
      'x-str-opt?': 'string',
      'x-ienum?': '1 | 2 | 3',
      'x-benum?': 'true',
      'x-iconst?': '7',
      'x-senum?': "'asc' | 'desc'",
      'x-ioneof?': "number.integer | 'all'",
      'x-range?': 'number.integer >= 1 & number.integer <= 100',
      'x-length?': type('string')
        .narrow((data, ctx) => [...data].length >= 2 || ctx.mustBe('at least 2 characters'))
        .narrow((data, ctx) => [...data].length <= 4 || ctx.mustBe('at most 4 characters')),
      'x-pattern?': type('string').and(/^[a-z]+-\d{1,3}$/),
      'x-tx-lower?': type('string.lower'),
      'x-tx-email?': type('string.lower').to('string.email'),
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
