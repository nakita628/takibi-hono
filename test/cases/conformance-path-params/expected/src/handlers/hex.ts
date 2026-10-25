import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const hexHandler = new Hono().get(
  '/hex/:value',
  describeRoute({ operationId: 'hexParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.hex() })),
  (c) => {},
)
