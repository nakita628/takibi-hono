import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const stringHandler = new Hono().get(
  '/string/:value',
  describeRoute({ operationId: 'stringParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.String }))),
  (c) => {},
)
