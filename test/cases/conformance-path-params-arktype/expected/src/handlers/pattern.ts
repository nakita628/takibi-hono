import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const patternHandler = new Hono().get(
  '/pattern/:value',
  describeRoute({ operationId: 'patternParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: type('string').and(/^[a-z]+-\d{1,3}$/) })),
  (c) => {},
)
