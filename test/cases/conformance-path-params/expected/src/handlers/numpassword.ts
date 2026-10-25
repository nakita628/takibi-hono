import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const numpasswordHandler = new Hono().get(
  '/numpassword/:value',
  describeRoute({ operationId: 'numpasswordParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.coerce.number() })),
  (c) => {},
)
