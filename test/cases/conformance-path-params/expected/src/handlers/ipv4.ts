import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const ipv4Handler = new Hono().get(
  '/ipv4/:value',
  describeRoute({ operationId: 'ipv4Param', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.ipv4() })),
  (c) => {},
)
