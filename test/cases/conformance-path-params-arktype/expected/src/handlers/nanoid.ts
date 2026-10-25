import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const nanoidHandler = new Hono().get(
  '/nanoid/:value',
  describeRoute({ operationId: 'nanoidParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: type(/^[a-zA-Z0-9_-]{21}$/) })),
  (c) => {},
)
