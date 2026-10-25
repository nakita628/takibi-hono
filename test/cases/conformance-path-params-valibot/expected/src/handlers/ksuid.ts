import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const ksuidHandler = new Hono().get(
  '/ksuid/:value',
  describeRoute({ operationId: 'ksuidParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.regex(/^[A-Za-z0-9]{27}$/)) })),
  (c) => {},
)
