import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const txlowerHandler = new Hono().get(
  '/txlower/:value',
  describeRoute({ operationId: 'txlowerParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.string().toLowerCase() })),
  (c) => {},
)
