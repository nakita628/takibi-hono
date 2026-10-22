import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const paramrefHandler = new Hono().get(
  '/paramref/:id',
  describeRoute({ operationId: 'paramrefParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(Schema.Struct({ id: Schema.NumberFromString.check(Schema.isInt()) })),
  ),
  (c) => {},
)
