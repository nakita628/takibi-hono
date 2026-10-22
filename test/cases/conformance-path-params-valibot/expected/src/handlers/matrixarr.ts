import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const matrixarrHandler = new Hono().get(
  '/matrixarr/:value',
  describeRoute({ operationId: 'matrixarrParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({ value: v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())) }),
  ),
  (c) => {},
)
