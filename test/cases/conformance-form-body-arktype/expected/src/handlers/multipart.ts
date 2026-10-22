import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const multipartHandler = new Hono().post(
  '/multipart',
  describeRoute({ operationId: 'multipart', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    type({
      file: 'string',
      'age?': 'number.integer',
      'active?': 'boolean',
      'ids?': 'number.integer[]',
    }),
  ),
  (c) => {},
)
