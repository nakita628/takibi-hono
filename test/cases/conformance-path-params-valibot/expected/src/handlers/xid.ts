import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const xidHandler = new Hono().get(
  '/xid/:value',
  describeRoute({ operationId: 'xidParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.regex(/^[0-9a-vA-V]{20}$/)) })),
  (c) => {},
)
