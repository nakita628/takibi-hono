import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const durationHandler = new Hono().get(
  '/duration/:value',
  describeRoute({ operationId: 'durationParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.iso.duration() })),
  (c) => {},
)
