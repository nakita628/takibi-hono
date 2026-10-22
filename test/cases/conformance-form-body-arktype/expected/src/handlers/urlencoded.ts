import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { CountSchema, FlagSchema, FieldsResponse } from '../components'

export const urlencodedHandler = new Hono().post(
  '/urlencoded',
  describeRoute({ operationId: 'urlencoded', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    type({
      'name?': 'string',
      'age?': 'number.integer >= 0',
      'ratio?': 'number',
      'big?': 'number.integer',
      'active?': 'boolean',
      'level?': '1 | 2',
      'agreed?': 'true',
      'limit?': 'number.integer',
      'count?': CountSchema,
      'flag?': FlagSchema,
      'tags?': 'string[]',
      'ids?': 'number.integer[]',
      'moment?': 'string.date.iso',
      'clock?': 'string',
      'maybe?': 'number.integer | null',
      'label?': 'string | null',
      'constructor?': 'number.integer',
    }),
  ),
  (c) => {},
)
