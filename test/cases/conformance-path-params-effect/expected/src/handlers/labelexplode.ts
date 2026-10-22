import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const labelexplodeHandler = new Hono().get(
  '/labelexplode/:value',
  describeRoute({ operationId: 'labelexplodeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({ value: Schema.Array(Schema.NumberFromString.check(Schema.isInt())) }),
    ),
  ),
  (c) => {},
)
