import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const bigintHandler = new Hono().get(
  '/bigint/:value',
  describeRoute({ operationId: 'bigintParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.integer.parse' })),
  (c) => {},
)
