import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const sconstHandler = new Hono().get(
  '/sconst/:value',
  describeRoute({ operationId: 'sconstParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.literal('fixed') })),
  (c) => {},
)
