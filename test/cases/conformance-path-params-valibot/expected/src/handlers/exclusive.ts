import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const exclusiveHandler = new Hono().get(
  '/exclusive/:value',
  describeRoute({ operationId: 'exclusiveParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(v.string(), v.transform(Number), v.number(), v.gtValue(0), v.ltValue(1)),
    }),
  ),
  (c) => {},
)
