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
      'int64_opt?': 'number.integer',
      'bool_opt?': 'boolean',
      'str_opt?': 'string',
      'ienum?': '1 | 2 | 3',
      'benum?': 'true',
      'iconst?': '7',
      'senum?': "'asc' | 'desc'",
      'ioneof?': "number.integer | 'all'",
      'range?': type('number.integer >= 1').and(type('number.integer <= 100')),
      'length?': type('2 <= string <= 4'),
      'pattern?': type('string').and(/^[a-z]+-\d{1,3}$/),
      'ref_int?': CountSchema,
      'prefs?': type({ 'theme?': 'string', 'size?': 'number.integer' }),
      'obj?': type({ 'a?': 'number.integer', 'b?': 'string' }),
      'tx_lower?': type('string').pipe((data: string) => data.toLowerCase()),
      'tx_email?': type('string.email').pipe((data: string) => data.toLowerCase()),
      'session-id?': 'number.integer',
      'user.id?': 'number.integer',
      'Int_Opt?': 'string',
      'inull?': 'number.integer | null',
      'constructor?': 'number.integer',
    }),
  ),
  (c) => {},
)
