import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const dateHandler = new Hono().get(
  '/date/:value',
  describeRoute({ operationId: 'dateParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.date' })),
  (c) => {},
)
