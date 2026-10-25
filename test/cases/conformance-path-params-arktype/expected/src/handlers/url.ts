import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const urlHandler = new Hono().get(
  '/url/:value',
  describeRoute({ operationId: 'urlParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.url' })),
  (c) => {},
)
