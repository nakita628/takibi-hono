import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const simpleobjxHandler = new Hono().get(
  '/simpleobjx/:value',
  describeRoute({ operationId: 'simpleobjxParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: type({ 'a?': 'string.integer.parse', 'b?': 'string' }) })),
  (c) => {},
)
