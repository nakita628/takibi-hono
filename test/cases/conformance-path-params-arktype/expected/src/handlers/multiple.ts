import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const multipleHandler = new Hono().get(
  '/multiple/:value',
  describeRoute({ operationId: 'multipleParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: type('string.integer.parse').to('number.integer % 5') })),
  (c) => {},
)
