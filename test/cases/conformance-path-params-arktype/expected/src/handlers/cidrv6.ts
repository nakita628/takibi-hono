import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const cidrv6Handler = new Hono().get(
  '/cidrv6/:value',
  describeRoute({ operationId: 'cidrv6Param', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string' })),
  (c) => {},
)
