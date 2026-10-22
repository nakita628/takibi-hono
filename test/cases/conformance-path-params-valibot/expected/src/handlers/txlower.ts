import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const txlowerHandler = new Hono().get(
  '/txlower/:value',
  describeRoute({ operationId: 'txlowerParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.toLowerCase()) })),
  (c) => {},
)
