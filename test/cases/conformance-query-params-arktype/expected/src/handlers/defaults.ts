import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'queryDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'int_def?': 'string.integer.parse',
      'int64_def?': 'string.integer.parse',
      'num_def?': 'string.numeric.parse',
      'bool_def?': type("'true' | 'false'").pipe((data) => data === 'true'),
      'bool_def_true?': type("'true' | 'false'").pipe((data) => data === 'true'),
      'str_def?': 'string',
      'enum_def?': "'asc' | 'desc'",
      'arr_def?': 'string[]',
      'arr_int_def?': 'string.integer.parse[]',
    }),
  ),
  (c) => {},
)
