import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const uuidHandler = new Hono().get(
  '/uuid/:value',
  describeRoute({ operationId: 'uuidParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.String.check(Schema.isUUID()) })),
  ),
  (c) => {},
)
