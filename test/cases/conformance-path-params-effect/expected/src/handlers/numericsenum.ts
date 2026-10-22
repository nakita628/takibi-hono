import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const numericsenumHandler = new Hono().get(
  '/numericsenum/:value',
  describeRoute({ operationId: 'numericsenumParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(Schema.Struct({ value: Schema.Literals(['1', '02', 'true']) })),
  ),
  (c) => {},
)
