import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const ulidHandler = new Hono().get(
  '/ulid/:value',
  describeRoute({ operationId: 'ulidParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: type(/^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/) })),
  (c) => {},
)
