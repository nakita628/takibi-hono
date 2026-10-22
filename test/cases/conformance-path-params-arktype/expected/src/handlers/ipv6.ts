import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const ipv6Handler = new Hono().get(
  '/ipv6/:value',
  describeRoute({ operationId: 'ipv6Param', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.ip' })),
  (c) => {},
)
