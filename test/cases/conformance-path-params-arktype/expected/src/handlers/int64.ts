import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const int64Handler = new Hono().get(
  '/int64/:value',
  describeRoute({ operationId: 'int64Param', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.integer.parse' })),
  (c) => {},
)
