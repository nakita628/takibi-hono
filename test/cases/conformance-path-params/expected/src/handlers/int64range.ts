import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const int64rangeHandler = new Hono().get(
  '/int64range/:value',
  describeRoute({ operationId: 'int64rangeParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.coerce.bigint().pipe(z.int64().min(1n).max(100n)) })),
  (c) => {},
)
