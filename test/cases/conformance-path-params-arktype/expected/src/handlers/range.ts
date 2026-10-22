import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const rangeHandler = new Hono().get(
  '/range/:value',
  describeRoute({ operationId: 'rangeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('string.integer.parse').to(
        type('number.integer >= 1').and(type('number.integer <= 10')),
      ),
    }),
  ),
  (c) => {},
)
