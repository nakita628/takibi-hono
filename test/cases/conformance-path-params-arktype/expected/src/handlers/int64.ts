import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const int64Handler = new Hono().get(
  '/int64/:value',
  describeRoute({ operationId: 'int64Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('string')
        .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
        .narrow(
          (data, ctx) =>
            (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
            ctx.mustBe('an int64'),
        ),
    }),
  ),
  (c) => {},
)
