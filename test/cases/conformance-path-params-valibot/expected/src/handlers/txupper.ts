import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const txupperHandler = new Hono().get(
  '/txupper/:value',
  describeRoute({ operationId: 'txupperParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.pipe(v.string(), v.toUpperCase()) })),
  (c) => {},
)
