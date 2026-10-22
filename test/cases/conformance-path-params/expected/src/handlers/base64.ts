import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const base64Handler = new Hono().get(
  '/base64/:value',
  describeRoute({ operationId: 'base64Param', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.base64() })),
  (c) => {},
)
