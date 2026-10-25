import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const matrixHandler = new Hono().get(
  '/matrix/:value',
  describeRoute({ operationId: 'matrixParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({ value: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()) }),
  ),
  (c) => {},
)
