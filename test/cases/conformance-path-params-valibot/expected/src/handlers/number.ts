import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const numberHandler = new Hono().get(
  '/number/:value',
  describeRoute({ operationId: 'numberParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({ value: v.pipe(v.string(), v.transform(Number), v.number(), v.finite()) }),
  ),
  (c) => {},
)
