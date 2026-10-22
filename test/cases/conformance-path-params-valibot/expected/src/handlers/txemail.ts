import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const txemailHandler = new Hono().get(
  '/txemail/:value',
  describeRoute({ operationId: 'txemailParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.toLowerCase(), v.email()) })),
  (c) => {},
)
