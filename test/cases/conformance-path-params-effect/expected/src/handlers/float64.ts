import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const float64Handler = new Hono().get(
  '/float64/:value',
  describeRoute({ operationId: 'float64Param', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.FiniteFromString }))),
  (c) => {},
)
