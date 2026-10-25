import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const matrixexplodeHandler = new Hono().get(
  '/matrixexplode/:value',
  describeRoute({ operationId: 'matrixexplodeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
        ).array(),
      ),
    }),
  ),
  (c) => {},
)
