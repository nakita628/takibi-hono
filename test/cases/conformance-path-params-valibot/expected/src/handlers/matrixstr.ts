import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const matrixstrHandler = new Hono().get(
  '/matrixstr/:value',
  describeRoute({ operationId: 'matrixstrParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: v.string() })),
  (c) => {},
)
