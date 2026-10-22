import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { CountSchema, EchoResponse } from '../components'

export const schemarefHandler = new Hono().get(
  '/schemaref/:value',
  describeRoute({ operationId: 'schemarefParam', responses: { '200': EchoResponse } }),
  validator('param', type({ value: CountSchema })),
  (c) => {},
)
