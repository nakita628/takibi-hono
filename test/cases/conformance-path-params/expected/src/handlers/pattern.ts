import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const patternHandler = new Hono().get(
  '/pattern/:value',
  describeRoute({ operationId: 'patternParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.string().regex(/^[a-z]+-\d{1,3}$/) })),
  (c) => {},
)
