import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const ulidHandler = new Hono().get(
  '/ulid/:value',
  describeRoute({ operationId: 'ulidParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.ulid() })),
  (c) => {},
)
