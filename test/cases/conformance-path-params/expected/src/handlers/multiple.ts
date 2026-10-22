import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const multipleHandler = new Hono().get(
  '/multiple/:value',
  describeRoute({ operationId: 'multipleParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.coerce.number().int().multipleOf(5) })),
  (c) => {},
)
