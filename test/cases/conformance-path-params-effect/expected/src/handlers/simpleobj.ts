import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const simpleobjHandler = new Hono().get(
  '/simpleobj/:value',
  describeRoute({ operationId: 'simpleobjParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.Struct({
          a: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
          b: Schema.optional(Schema.String),
        }),
      }),
    ),
  ),
  (c) => {},
)
