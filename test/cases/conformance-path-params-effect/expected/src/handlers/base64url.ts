import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const base64urlHandler = new Hono().get(
  '/base64url/:value',
  describeRoute({ operationId: 'base64urlParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.String }))),
  (c) => {},
)
