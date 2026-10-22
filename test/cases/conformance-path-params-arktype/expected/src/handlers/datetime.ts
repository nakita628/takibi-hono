import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const datetimeHandler = new Hono().get(
  '/datetime/:value',
  describeRoute({ operationId: 'datetimeParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.date.iso' })),
  (c) => {},
)
