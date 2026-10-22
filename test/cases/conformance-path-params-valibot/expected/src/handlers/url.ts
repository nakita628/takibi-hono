import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const urlHandler = new Hono().get(
  '/url/:value',
  describeRoute({ operationId: 'urlParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.string() })),
  (c) => {},
)
