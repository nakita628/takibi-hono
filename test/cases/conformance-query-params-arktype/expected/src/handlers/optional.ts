import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'queryOptional', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'int_opt?': 'string.integer.parse',
      'int64_opt?': 'string.integer.parse',
      'num_opt?': 'string.numeric.parse',
      'bool_opt?': type("'true' | 'false'").pipe((data) => data === 'true'),
      'str_opt?': 'string',
      'uuid_opt?': 'string.uuid',
      'arr_opt?': 'string.integer.parse[]',
      'page-size?': 'string.integer.parse',
      'filter[name]?': 'string',
      '$top?': 'string.integer.parse',
      'user.id?': 'string.integer.parse',
      'ids[]?': 'string.integer.parse[]',
      'Int_Opt?': 'string',
      'constructor?': 'string.integer.parse',
    }),
  ),
  (c) => {},
)
