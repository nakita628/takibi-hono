import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const txupperHandler = new Hono().get(
  '/txupper/:value',
  describeRoute({ operationId: 'txupperParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: type('string.upper') })),
  (c) => {},
)
