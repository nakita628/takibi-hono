import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const matrixstrHandler = new Hono().get(
  '/matrixstr/:value',
  describeRoute({ operationId: 'matrixstrParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string' })),
  (c) => {},
)
