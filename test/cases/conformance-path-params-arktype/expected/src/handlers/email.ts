import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const emailHandler = new Hono().get(
  '/email/:value',
  describeRoute({ operationId: 'emailParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.email' })),
  (c) => {},
)
