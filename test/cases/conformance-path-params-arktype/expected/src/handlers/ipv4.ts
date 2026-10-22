import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const ipv4Handler = new Hono().get(
  '/ipv4/:value',
  describeRoute({ operationId: 'ipv4Param', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.ip' })),
  (c) => {},
)
