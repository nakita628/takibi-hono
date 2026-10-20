import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const uuidHandler = new Hono().get(
  '/uuid/:value',
  describeRoute({ operationId: 'uuidParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.uuid() })),
  (c) => {},
)
