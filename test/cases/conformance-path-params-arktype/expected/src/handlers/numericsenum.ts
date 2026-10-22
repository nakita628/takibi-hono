import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const numericsenumHandler = new Hono().get(
  '/numericsenum/:value',
  describeRoute({ operationId: 'numericsenumParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: "'1' | '02' | 'true'" })),
  (c) => {},
)
