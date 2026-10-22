import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const inullHandler = new Hono().get(
  '/inull/:value',
  describeRoute({ operationId: 'inullParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({ value: Schema.NullOr(Schema.NumberFromString.check(Schema.isInt())) }),
    ),
  ),
  (c) => {},
)
