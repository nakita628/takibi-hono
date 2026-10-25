import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const xidHandler = new Hono().get(
  '/xid/:value',
  describeRoute({ operationId: 'xidParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.xid() })),
  (c) => {},
)
