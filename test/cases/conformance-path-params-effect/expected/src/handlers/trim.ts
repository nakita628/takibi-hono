import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const trimHandler = new Hono().get(
  '/trim/:value',
  describeRoute({ operationId: 'trimParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.Trim }))),
  (c) => {},
)
