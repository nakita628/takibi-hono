import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const rangeHandler = new Hono().get(
  '/range/:value',
  describeRoute({ operationId: 'rangeParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.coerce.number().int().min(1).max(10) })),
  (c) => {},
)
