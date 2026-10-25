import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const numberHandler = new Hono().get(
  '/number/:value',
  describeRoute({ operationId: 'numberParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.FiniteFromString }))),
  (c) => {},
)
