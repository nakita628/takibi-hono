import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const emailHandler = new Hono().get(
  '/email/:value',
  describeRoute({ operationId: 'emailParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.email() })),
  (c) => {},
)
