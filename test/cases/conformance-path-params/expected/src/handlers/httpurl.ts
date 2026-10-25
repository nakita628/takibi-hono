import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const httpurlHandler = new Hono().get(
  '/httpurl/:value',
  describeRoute({ operationId: 'httpurlParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.httpUrl() })),
  (c) => {},
)
