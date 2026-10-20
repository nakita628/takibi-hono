import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const matrixHandler = new Hono().get(
  '/matrix/:value',
  describeRoute({ operationId: 'matrixParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.coerce.number().int() })),
  (c) => {},
)
