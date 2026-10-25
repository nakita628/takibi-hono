import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { FieldsResponse } from '../components'

export const contentHandler = new Hono().get(
  '/content',
  describeRoute({ operationId: 'queryContent', responses: { '200': FieldsResponse } }),
  (c) => {},
)
