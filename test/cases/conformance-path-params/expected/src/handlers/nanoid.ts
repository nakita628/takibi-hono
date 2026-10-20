import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const nanoidHandler = new Hono().get(
  '/nanoid/:value',
  describeRoute({ operationId: 'nanoidParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.nanoid() })),
  (c) => {},
)
