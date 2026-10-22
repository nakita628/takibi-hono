import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const int64rangeHandler = new Hono().get(
  '/int64range/:value',
  describeRoute({ operationId: 'int64rangeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.transform(Number),
        v.number(),
        v.integer(),
        v.minValue(1),
        v.maxValue(100),
      ),
    }),
  ),
  (c) => {},
)
