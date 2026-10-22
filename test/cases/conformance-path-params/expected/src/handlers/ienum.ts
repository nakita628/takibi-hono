import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const ienumHandler = new Hono().get(
  '/ienum/:value',
  describeRoute({ operationId: 'ienumParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.union([z.literal(1), z.literal(2)]) })),
  (c) => {},
)
