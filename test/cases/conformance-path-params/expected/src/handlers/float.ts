import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const floatHandler = new Hono().get(
  '/float/:value',
  describeRoute({ operationId: 'floatParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.coerce.number().pipe(z.float32()) })),
  (c) => {},
)
