import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const txnormalizeHandler = new Hono().get(
  '/txnormalize/:value',
  describeRoute({ operationId: 'txnormalizeParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.string().normalize('NFKC') })),
  (c) => {},
)
