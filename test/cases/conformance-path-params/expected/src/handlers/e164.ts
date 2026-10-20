import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const e164Handler = new Hono().get(
  '/e164/:value',
  describeRoute({ operationId: 'e164Param', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.string() })),
  (c) => {},
)
