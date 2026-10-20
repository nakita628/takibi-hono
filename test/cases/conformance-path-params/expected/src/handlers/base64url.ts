import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const base64urlHandler = new Hono().get(
  '/base64url/:value',
  describeRoute({ operationId: 'base64urlParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.base64url() })),
  (c) => {},
)
