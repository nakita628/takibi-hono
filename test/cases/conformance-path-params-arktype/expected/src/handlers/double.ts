import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const doubleHandler = new Hono().get(
  '/double/:value',
  describeRoute({ operationId: 'doubleParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isFinite(value) ? value : ctx.error('a number')
      }),
    }),
  ),
  (c) => {},
)
