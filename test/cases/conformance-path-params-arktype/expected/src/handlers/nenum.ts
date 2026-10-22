import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const nenumHandler = new Hono().get(
  '/nenum/:value',
  describeRoute({ operationId: 'nenumParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: '0.5 | 2.5' })),
  (c) => {},
)
