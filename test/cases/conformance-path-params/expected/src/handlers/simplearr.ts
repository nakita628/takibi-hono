import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const simplearrHandler = new Hono().get(
  '/simplearr/:value',
  describeRoute({ operationId: 'simplearrParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.array(z.coerce.number().int()) })),
  (c) => {},
)
