import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const base64Handler = new Hono().get(
  '/base64/:value',
  describeRoute({ operationId: 'base64Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.String.check(Schema.isBase64()) })),
  ),
  (c) => {},
)
