import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const senumHandler = new Hono().get(
  '/senum/:value',
  describeRoute({ operationId: 'senumParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.picklist(['asc', 'desc']) })),
  (c) => {},
)
