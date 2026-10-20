import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const cidrv6Handler = new Hono().get(
  '/cidrv6/:value',
  describeRoute({ operationId: 'cidrv6Param', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.cidrv6() })),
  (c) => {},
)
