import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const float32Handler = new Hono().get(
  '/float32/:value',
  describeRoute({ operationId: 'float32Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/),
        v.transform((input) => Number(input)),
        v.number(),
        v.finite(),
        v.minValue(-3.4028234663852886e38),
        v.maxValue(3.4028234663852886e38),
      ),
    }),
  ),
  (c) => {},
)
