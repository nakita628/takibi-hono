import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const exclusiveHandler = new Hono().get(
  '/exclusive/:value',
  describeRoute({ operationId: 'exclusiveParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isFinite(value) ? value : ctx.error('a number')
        })
        .to('number > 0 & number < 1'),
    }),
  ),
  (c) => {},
)
