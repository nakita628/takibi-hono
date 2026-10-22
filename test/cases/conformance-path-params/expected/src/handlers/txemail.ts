import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const txemailHandler = new Hono().get(
  '/txemail/:value',
  describeRoute({ operationId: 'txemailParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.email().toLowerCase() })),
  (c) => {},
)
