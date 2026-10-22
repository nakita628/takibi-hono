import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const uuidHandler = new Hono().get(
  '/uuid/:value',
  describeRoute({ operationId: 'uuidParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.uuid()) })),
  (c) => {},
)
