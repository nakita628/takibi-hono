import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const matrixobjxHandler = new Hono().get(
  '/matrixobjx/:value',
  describeRoute({ operationId: 'matrixobjxParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.Struct({
          a: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
          b: Schema.optional(Schema.String),
        }),
      }),
    ),
  ),
  (c) => {},
)
