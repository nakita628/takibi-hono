import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const ksuidHandler = new Hono().get(
  '/ksuid/:value',
  describeRoute({ operationId: 'ksuidParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.string() })),
  (c) => {},
)
