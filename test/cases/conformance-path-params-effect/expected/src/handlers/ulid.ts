import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const ulidHandler = new Hono().get(
  '/ulid/:value',
  describeRoute({ operationId: 'ulidParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.String.check(Schema.isULID()) })),
  ),
  (c) => {},
)
