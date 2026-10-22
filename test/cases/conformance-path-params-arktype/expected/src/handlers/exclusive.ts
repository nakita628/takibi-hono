import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const exclusiveHandler = new Hono().get(
  '/exclusive/:value',
  describeRoute({ operationId: 'exclusiveParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({ value: type('string.numeric.parse').to(type('number > 0').and(type('number < 1'))) }),
  ),
  (c) => {},
)
