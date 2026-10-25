import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const lengthHandler = new Hono().get(
  '/length/:value',
  describeRoute({ operationId: 'lengthParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({ value: v.pipe(v.string(), v.minCodePoints(2), v.maxCodePoints(4)) }),
  ),
  (c) => {},
)
