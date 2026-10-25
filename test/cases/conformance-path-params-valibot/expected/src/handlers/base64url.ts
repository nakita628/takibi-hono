import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const base64urlHandler = new Hono().get(
  '/base64url/:value',
  describeRoute({ operationId: 'base64urlParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]*$/)) })),
  (c) => {},
)
