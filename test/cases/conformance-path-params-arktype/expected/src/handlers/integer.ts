import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const integerHandler = new Hono().get(
  '/integer/:value',
  describeRoute({ operationId: 'integerParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.integer.parse' })),
  (c) => {},
)
