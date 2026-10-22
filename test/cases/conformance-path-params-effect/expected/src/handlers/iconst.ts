import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const iconstHandler = new Hono().get(
  '/iconst/:value',
  describeRoute({ operationId: 'iconstParam', responses: { '200': EchoResponse } }),
  validator('param', Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.Literal(7) }))),
  (c) => {},
)
