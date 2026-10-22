import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const paramrefHandler = new Hono().get(
  '/paramref/:id',
  describeRoute({ operationId: 'paramrefParam', responses: { '200': EchoResponse } }),
  validator('param', type({ id: 'string.integer.parse' })),
  (c) => {},
)
