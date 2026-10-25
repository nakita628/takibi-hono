import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { CountSchema, EchoResponse } from '../components'

export const schemarefHandler = new Hono().get(
  '/schemaref/:value',
  describeRoute({ operationId: 'schemarefParam', responses: { '200': EchoResponse } }),
  validator('param', v.object({ value: CountSchema })),
  (c) => {},
)
