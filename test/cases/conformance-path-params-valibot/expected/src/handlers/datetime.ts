import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const datetimeHandler = new Hono().get(
  '/datetime/:value',
  describeRoute({ operationId: 'datetimeParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.isoTimestamp()) })),
  (c) => {},
)
