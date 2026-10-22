import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const overrideHandler = new Hono().get(
  '/override/:id',
  describeRoute({ operationId: 'overrideParam', responses: { '200': EchoResponse } }),
  validator('param', type({ id: 'string.integer.parse' })),
  (c) => {},
)
