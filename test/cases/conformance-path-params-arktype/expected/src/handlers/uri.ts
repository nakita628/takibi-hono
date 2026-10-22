import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const uriHandler = new Hono().get(
  '/uri/:value',
  describeRoute({ operationId: 'uriParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.url' })),
  (c) => {},
)
