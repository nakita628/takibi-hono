import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const labelexplodeHandler = new Hono().get(
  '/labelexplode/:value',
  describeRoute({ operationId: 'labelexplodeParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.integer.parse[]' })),
  (c) => {},
)
