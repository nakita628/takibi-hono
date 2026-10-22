import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { CountSchema, EchoResponse } from '../components'

export const schemarefHandler = new Hono().get(
  '/schemaref/:value',
  describeRoute({ operationId: 'schemarefParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: CountSchema }))),
  (c) => {},
)
