import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const stringHandler = new Hono().get(
  '/string/:value',
  describeRoute({ operationId: 'stringParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.string() })),
  (c) => {},
)
