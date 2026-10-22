import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const patternHandler = new Hono().get(
  '/pattern/:value',
  describeRoute({ operationId: 'patternParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.regex(/^[a-z]+-\d{1,3}$/)) })),
  (c) => {},
)
