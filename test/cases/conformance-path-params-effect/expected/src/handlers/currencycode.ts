import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const currencycodeHandler = new Hono().get(
  '/currencycode/:value',
  describeRoute({ operationId: 'currencycodeParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.String }))),
  (c) => {},
)
