import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const int32Handler = new Hono().get(
  '/int32/:value',
  describeRoute({ operationId: 'int32Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.transform(Number),
        v.number(),
        v.safeInteger(),
        v.minValue(-2147483648),
        v.maxValue(2147483647),
      ),
    }),
  ),
  (c) => {},
)
