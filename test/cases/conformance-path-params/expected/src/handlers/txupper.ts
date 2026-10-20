import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const txupperHandler = new Hono().get(
  '/txupper/:value',
  describeRoute({ operationId: 'txupperParam', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.string().toUpperCase() })),
  (c) => {},
)
