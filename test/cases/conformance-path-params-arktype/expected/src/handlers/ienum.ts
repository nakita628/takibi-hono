import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const ienumHandler = new Hono().get(
  '/ienum/:value',
  describeRoute({ operationId: 'ienumParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: '1 | 2' })),
  (c) => {},
)
