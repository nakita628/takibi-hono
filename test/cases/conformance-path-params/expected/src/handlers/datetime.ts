import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const datetimeHandler = new Hono().get(
  '/datetime/:value',
  describeRoute({ operationId: 'datetimeParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.iso.datetime() })),
  (c) => {},
)
