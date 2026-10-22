import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const simplearrHandler = new Hono().get(
  '/simplearr/:value',
  describeRoute({ operationId: 'simplearrParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({ value: v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())) }),
  ),
  (c) => {},
)
