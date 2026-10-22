import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const cidrv4Handler = new Hono().get(
  '/cidrv4/:value',
  describeRoute({ operationId: 'cidrv4Param', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.cidrv4() })),
  (c) => {},
)
