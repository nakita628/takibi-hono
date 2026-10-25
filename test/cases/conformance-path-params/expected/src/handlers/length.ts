import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const lengthHandler = new Hono().get(
  '/length/:value',
  describeRoute({ operationId: 'lengthParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.string().min(2).max(4) })),
  (c) => {},
)
