import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const overrideHandler = new Hono().get(
  '/override/:id',
  describeRoute({ operationId: 'overrideParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      id: type('string').pipe((data, ctx) => {
        const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
    }),
  ),
  (c) => {},
)
