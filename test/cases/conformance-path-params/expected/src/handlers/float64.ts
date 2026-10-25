import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const float64Handler = new Hono().get(
  '/float64/:value',
  describeRoute({ operationId: 'float64Param', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.coerce.number().pipe(z.float64()) })),
  (c) => {},
)
