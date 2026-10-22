import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const labelHandler = new Hono().get(
  '/label/:value',
  describeRoute({ operationId: 'labelParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.integer.parse' })),
  (c) => {},
)
