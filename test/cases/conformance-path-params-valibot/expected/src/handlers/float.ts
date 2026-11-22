import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const floatHandler = new Hono().get(
  '/float/:value',
  describeRoute({ operationId: 'floatParam', responses: { '200': EchoResponse } }),
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
