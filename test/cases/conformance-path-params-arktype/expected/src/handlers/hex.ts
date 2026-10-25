import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const hexHandler = new Hono().get(
  '/hex/:value',
  describeRoute({ operationId: 'hexParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.hex' })),
  (c) => {},
)
