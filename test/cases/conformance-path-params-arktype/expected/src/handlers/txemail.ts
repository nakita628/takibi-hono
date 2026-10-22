import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const txemailHandler = new Hono().get(
  '/txemail/:value',
  describeRoute({ operationId: 'txemailParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    type({ value: type('string.email').pipe((data: string) => data.toLowerCase()) }),
  ),
  (c) => {},
)
