import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const benumHandler = new Hono().get(
  '/benum/:value',
  describeRoute({ operationId: 'benumParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.literal(true) })),
  (c) => {},
)
