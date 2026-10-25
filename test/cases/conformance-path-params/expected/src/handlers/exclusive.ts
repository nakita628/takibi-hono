import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const exclusiveHandler = new Hono().get(
  '/exclusive/:value',
  describeRoute({ operationId: 'exclusiveParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.coerce.number().gt(0).lt(1) })),
  (c) => {},
)
