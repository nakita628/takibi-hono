import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const uuidv4Handler = new Hono().get(
  '/uuidv4/:value',
  describeRoute({ operationId: 'uuidv4Param', responses: { '200': EchoResponse } }),
  validator('param', z.object({ value: z.uuidv4() })),
  (c) => {},
)
