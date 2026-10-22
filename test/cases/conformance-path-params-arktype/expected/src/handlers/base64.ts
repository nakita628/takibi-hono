import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const base64Handler = new Hono().get(
  '/base64/:value',
  describeRoute({ operationId: 'base64Param', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string' })),
  (c) => {},
)
