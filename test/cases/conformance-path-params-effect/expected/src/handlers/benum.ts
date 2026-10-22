import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const benumHandler = new Hono().get(
  '/benum/:value',
  describeRoute({ operationId: 'benumParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.Literal(true) }))),
  (c) => {},
)
