import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const ipv6Handler = new Hono().get(
  '/ipv6/:value',
  describeRoute({ operationId: 'ipv6Param', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.ipv6() })),
  (c) => {},
)
