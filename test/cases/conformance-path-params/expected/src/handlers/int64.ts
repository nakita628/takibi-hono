import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const int64Handler = new Hono().get(
  '/int64/:value',
  describeRoute({ operationId: 'int64Param', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.coerce.bigint().pipe(z.int64()) })),
  (c) => {},
)
