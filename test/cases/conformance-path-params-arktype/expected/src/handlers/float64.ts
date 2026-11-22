import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const float64Handler = new Hono().get(
  '/float64/:value',
  describeRoute({ operationId: 'float64Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('string').pipe((data, ctx) => {
        const value = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(data)
          ? Number(data)
          : Number.NaN
        return Number.isFinite(value) ? value : ctx.error('a number')
      }),
    }),
  ),
  (c) => {},
)
