import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const labelstrHandler = new Hono().get(
  '/labelstr/:value',
  describeRoute({ operationId: 'labelstrParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.string() })),
  (c) => {},
)
