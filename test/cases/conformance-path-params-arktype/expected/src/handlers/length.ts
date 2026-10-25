import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const lengthHandler = new Hono().get(
  '/length/:value',
  describeRoute({ operationId: 'lengthParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('string')
        .narrow((data, ctx) => [...data].length >= 2 || ctx.mustBe('at least 2 characters'))
        .narrow((data, ctx) => [...data].length <= 4 || ctx.mustBe('at most 4 characters')),
    }),
  ),
  (c) => {},
)
