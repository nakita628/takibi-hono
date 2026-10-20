import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const dateHandler = new Hono().get(
  '/date/:value',
  describeRoute({ operationId: 'dateParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.iso.date() })),
  (c) => {},
)
