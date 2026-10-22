import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const dateHandler = new Hono().get(
  '/date/:value',
  describeRoute({ operationId: 'dateParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.isoDate()) })),
  (c) => {},
)
