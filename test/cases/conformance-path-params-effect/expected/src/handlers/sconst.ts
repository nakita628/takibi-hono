import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const sconstHandler = new Hono().get(
  '/sconst/:value',
  describeRoute({ operationId: 'sconstParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.Literal('fixed') }))),
  (c) => {},
)
