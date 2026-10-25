import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const floatHandler = new Hono().get(
  '/float/:value',
  describeRoute({ operationId: 'floatParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isFinite(value) ? value : ctx.error('a number')
        })
        .to('number >= -3.4028234663852886e38 & number <= 3.4028234663852886e38'),
    }),
  ),
  (c) => {},
)
