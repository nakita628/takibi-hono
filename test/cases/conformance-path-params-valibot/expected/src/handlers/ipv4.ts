import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const ipv4Handler = new Hono().get(
  '/ipv4/:value',
  describeRoute({ operationId: 'ipv4Param', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.ipv4()) })),
  (c) => {},
)
