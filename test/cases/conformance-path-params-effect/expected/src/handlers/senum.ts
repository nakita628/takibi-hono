import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const senumHandler = new Hono().get(
  '/senum/:value',
  describeRoute({ operationId: 'senumParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.Literals(['asc', 'desc']) })),
  ),
  (c) => {},
)
