import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const matrixHandler = new Hono().get(
  '/matrix/:value',
  describeRoute({ operationId: 'matrixParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.integer.parse' })),
  (c) => {},
)
