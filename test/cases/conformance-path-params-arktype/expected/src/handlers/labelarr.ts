import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const labelarrHandler = new Hono().get(
  '/labelarr/:value',
  describeRoute({ operationId: 'labelarrParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: 'string.integer.parse[]' })),
  (c) => {},
)
