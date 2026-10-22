import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const booleanHandler = new Hono().get(
  '/boolean/:value',
  describeRoute({ operationId: 'booleanParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: type("'true' | 'false'").pipe((data) => data === 'true') })),
  (c) => {},
)
