import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const labelobjxHandler = new Hono().get(
  '/labelobjx/:value',
  describeRoute({ operationId: 'labelobjxParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type({
        'a?': type('string').pipe((data, ctx) => {
          const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
        'b?': 'string',
      }),
    }),
  ),
  (c) => {},
)
