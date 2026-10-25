import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const cuid2Handler = new Hono().get(
  '/cuid2/:value',
  describeRoute({ operationId: 'cuid2Param', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.cuid2()) })),
  (c) => {},
)
