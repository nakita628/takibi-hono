import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const matrixexplodeHandler = new Hono().get(
  '/matrixexplode/:value',
  describeRoute({ operationId: 'matrixexplodeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({ value: Schema.Array(Schema.NumberFromString.check(Schema.isInt())) }),
    ),
  ),
  (c) => {},
)
