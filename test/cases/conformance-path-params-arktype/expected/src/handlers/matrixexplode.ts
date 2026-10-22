import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const matrixexplodeHandler = new Hono().get(
  '/matrixexplode/:value',
  describeRoute({ operationId: 'matrixexplodeParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.integer.parse[]' })),
  (c) => {},
)
