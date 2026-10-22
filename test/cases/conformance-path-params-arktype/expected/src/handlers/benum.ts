import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const benumHandler = new Hono().get(
  '/benum/:value',
  describeRoute({ operationId: 'benumParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'true' })),
  (c) => {},
)
