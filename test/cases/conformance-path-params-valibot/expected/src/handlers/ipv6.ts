import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const ipv6Handler = new Hono().get(
  '/ipv6/:value',
  describeRoute({ operationId: 'ipv6Param', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.ipv6()) })),
  (c) => {},
)
