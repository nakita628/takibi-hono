import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const ienumHandler = new Hono().get(
  '/ienum/:value',
  describeRoute({ operationId: 'ienumParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.Literals([1, 2]) }))),
  (c) => {},
)
