import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const timeHandler = new Hono().get(
  '/time/:value',
  describeRoute({ operationId: 'timeParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.iso.time() })),
  (c) => {},
)
