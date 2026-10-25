import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { ItemSchema, FieldsResponse } from '../components'

export const jsonHandler = new Hono().post(
  '/json',
  describeRoute({ operationId: 'json', responses: { '200': FieldsResponse } }),
  validator('json', ItemSchema),
  (c) => {},
)
