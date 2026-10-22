import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const benumHandler = new Hono().get(
  '/benum/:value',
  describeRoute({ operationId: 'benumParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.literal(true) })),
  (c) => {},
)
