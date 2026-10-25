import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const stringHandler = new Hono().get(
  '/string/:value',
  describeRoute({ operationId: 'stringParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.string() })),
  (c) => {},
)
