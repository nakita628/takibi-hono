import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const ibanHandler = new Hono().get(
  '/iban/:value',
  describeRoute({ operationId: 'ibanParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.String }))),
  (c) => {},
)
