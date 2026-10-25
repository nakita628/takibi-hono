import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { CountSchema, FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'cookieOptional', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    type({
      'int_opt?': 'number.integer',
      'int64_opt?': type('bigint | number.integer')
        .or(/^-?\d+$/)
        .pipe((data) => BigInt(data))
        .narrow(
          (data, ctx) =>
            (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
            ctx.mustBe('an int64'),
        ),
      'bool_opt?': 'boolean',
      'str_opt?': 'string',
      'ienum?': '1 | 2 | 3',
      'benum?': 'true',
      'iconst?': '7',
      'senum?': "'asc' | 'desc'",
      'ioneof?': "number.integer | 'all'",
      'range?': 'number.integer >= 1 & number.integer <= 100',
      'length?': type('string')
        .narrow((data, ctx) => [...data].length >= 2 || ctx.mustBe('at least 2 characters'))
        .narrow((data, ctx) => [...data].length <= 4 || ctx.mustBe('at most 4 characters')),
      'pattern?': type('string').and(/^[a-z]+-\d{1,3}$/),
      'ref_int?': CountSchema,
      'prefs?': type({ 'theme?': 'string', 'size?': 'number.integer' }),
      'obj?': type({ 'a?': 'number.integer', 'b?': 'string' }),
      'tx_lower?': type('string.lower'),
      'tx_email?': type('string.lower').to('string.email'),
      'session-id?': 'number.integer',
      'user.id?': 'number.integer',
      'Int_Opt?': 'string',
      'inull?': 'number.integer | null',
      'constructor?': 'number.integer',
    }),
  ),
  (c) => {},
)
