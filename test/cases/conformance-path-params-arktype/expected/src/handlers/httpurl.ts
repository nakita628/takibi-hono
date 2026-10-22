import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const httpurlHandler = new Hono().get(
  '/httpurl/:value',
  describeRoute({ operationId: 'httpurlParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string' })),
  (c) => {},
)
