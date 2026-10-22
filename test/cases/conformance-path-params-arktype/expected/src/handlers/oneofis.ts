import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const oneofisHandler = new Hono().get(
  '/oneofis/:value',
  describeRoute({ operationId: 'oneofisParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.integer.parse | string' })),
  (c) => {},
)
