import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const numpasswordHandler = new Hono().get(
  '/numpassword/:value',
  describeRoute({ operationId: 'numpasswordParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.numeric.parse' })),
  (c) => {},
)
