import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const macHandler = new Hono().get(
  '/mac/:value',
  describeRoute({ operationId: 'macParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.mac()) })),
  (c) => {},
)
