import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const senumHandler = new Hono().get(
  '/senum/:value',
  describeRoute({ operationId: 'senumParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: "'asc' | 'desc'" })),
  (c) => {},
)
