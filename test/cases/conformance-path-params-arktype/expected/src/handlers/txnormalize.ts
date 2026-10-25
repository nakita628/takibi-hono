import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const txnormalizeHandler = new Hono().get(
  '/txnormalize/:value',
  describeRoute({ operationId: 'txnormalizeParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: type('string.normalize.NFKC') })),
  (c) => {},
)
