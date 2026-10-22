import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { EchoResponse } from '../components'

export const sconstHandler = new Hono().get(
  '/sconst/:value',
  describeRoute({ operationId: 'sconstParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: "'fixed'" })),
  (c) => {},
)
