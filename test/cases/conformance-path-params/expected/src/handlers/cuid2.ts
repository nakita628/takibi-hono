import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const cuid2Handler = new Hono().get(
  '/cuid2/:value',
  describeRoute({ operationId: 'cuid2Param', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.cuid2() })),
  (c) => {},
)
