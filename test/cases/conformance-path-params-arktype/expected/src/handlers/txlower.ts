import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const txlowerHandler = new Hono().get(
  '/txlower/:value',
  describeRoute({ operationId: 'txlowerParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: type('string').pipe((data: string) => data.toLowerCase()) })),
  (c) => {},
)
