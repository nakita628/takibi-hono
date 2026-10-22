import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const base64Handler = new Hono().get(
  '/base64/:value',
  describeRoute({ operationId: 'base64Param', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.base64()) })),
  (c) => {},
)
