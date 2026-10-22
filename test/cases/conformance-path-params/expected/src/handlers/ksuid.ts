import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const ksuidHandler = new Hono().get(
  '/ksuid/:value',
  describeRoute({ operationId: 'ksuidParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.string() })),
  (c) => {},
)
