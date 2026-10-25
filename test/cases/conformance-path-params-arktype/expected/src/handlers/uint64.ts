import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const uint64Handler = new Hono().get(
  '/uint64/:value',
  describeRoute({ operationId: 'uint64Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('string')
        .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
        .narrow(
          (data, ctx) => (data >= 0n && data <= 18446744073709551615n) || ctx.mustBe('a uint64'),
        ),
    }),
  ),
  (c) => {},
)
