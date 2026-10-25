import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const txnormalizeHandler = new Hono().get(
  '/txnormalize/:value',
  describeRoute({ operationId: 'txnormalizeParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.normalize('NFKC')) })),
  (c) => {},
)
