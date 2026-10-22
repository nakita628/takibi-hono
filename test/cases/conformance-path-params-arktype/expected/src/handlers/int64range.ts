import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const int64rangeHandler = new Hono().get(
  '/int64range/:value',
  describeRoute({ operationId: 'int64rangeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({
      value: type('string.integer.parse').to(
        type('number.integer >= 1').and(type('number.integer <= 100')),
      ),
    }),
  ),
  (c) => {},
)
