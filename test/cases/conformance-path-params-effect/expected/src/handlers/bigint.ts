import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const bigintHandler = new Hono().get(
  '/bigint/:value',
  describeRoute({ operationId: 'bigintParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.BigInt }))),
  (c) => {},
)
