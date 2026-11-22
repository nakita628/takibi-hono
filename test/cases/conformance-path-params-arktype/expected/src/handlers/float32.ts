import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const float32Handler = new Hono().get(
  '/float32/:value',
  describeRoute({ operationId: 'float32Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('string')
        .pipe((data, ctx) => {
          const value = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(data)
            ? Number(data)
            : Number.NaN
          return Number.isFinite(value) ? value : ctx.error('a number')
        })
        .pipe(type('number').atLeast(-3.4028234663852886e38).atMost(3.4028234663852886e38)),
    }),
  ),
  (c) => {},
)
