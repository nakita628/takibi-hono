import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const urlHandler = new Hono().get(
  '/url/:value',
  describeRoute({ operationId: 'urlParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.url() })),
  (c) => {},
)
