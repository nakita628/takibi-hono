import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const emailHandler = new Hono().get(
  '/email/:value',
  describeRoute({ operationId: 'emailParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.email()) })),
  (c) => {},
)
