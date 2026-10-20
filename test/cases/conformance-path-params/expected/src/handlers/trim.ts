import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const trimHandler = new Hono().get(
  '/trim/:value',
  describeRoute({ operationId: 'trimParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.trim() })),
  (c) => {},
)
