import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const senumHandler = new Hono().get(
  '/senum/:value',
  describeRoute({ operationId: 'senumParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.enum(['asc', 'desc']) })),
  (c) => {},
)
