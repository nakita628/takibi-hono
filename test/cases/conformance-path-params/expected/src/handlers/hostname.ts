import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const hostnameHandler = new Hono().get(
  '/hostname/:value',
  describeRoute({ operationId: 'hostnameParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.string() })),
  (c) => {},
)
