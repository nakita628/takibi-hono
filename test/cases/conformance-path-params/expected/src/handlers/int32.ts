import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const int32Handler = new Hono().get(
  '/int32/:value',
  describeRoute({ operationId: 'int32Param', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.coerce.number().pipe(z.int32()) })),
  (c) => {},
)
