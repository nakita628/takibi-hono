import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const labelexplodeHandler = new Hono().get(
  '/labelexplode/:value',
  describeRoute({ operationId: 'labelexplodeParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.array(z.coerce.number().int()) })),
  (c) => {},
)
