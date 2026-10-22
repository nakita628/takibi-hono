import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const strpasswordHandler = new Hono().get(
  '/strpassword/:value',
  describeRoute({ operationId: 'strpasswordParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.string() })),
  (c) => {},
)
