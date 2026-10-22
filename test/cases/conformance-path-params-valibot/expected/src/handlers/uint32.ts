import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const uint32Handler = new Hono().get(
  '/uint32/:value',
  describeRoute({ operationId: 'uint32Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({ value: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()) }),
  ),
  (c) => {},
)
