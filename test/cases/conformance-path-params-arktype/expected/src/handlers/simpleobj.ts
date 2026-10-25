import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const simpleobjHandler = new Hono().get(
  '/simpleobj/:value',
  describeRoute({ operationId: 'simpleobjParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type({
        'a?': type('string').pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
        'b?': 'string',
      }),
    }),
  ),
  (c) => {},
)
