import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'cookieRequired', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        id: Schema.FiniteFromString.check(Schema.isInt()),
        big: Schema.BigIntFromString.check(
          Schema.isBetweenBigInt({ minimum: -9223372036854775808n, maximum: 9223372036854775807n }),
        ),
        flag: Schema.String.check(
          Schema.isPattern(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
        ).pipe(
          Schema.decodeTo(
            Schema.Boolean,
            SchemaTransformation.transform({
              decode: (input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input),
              encode: (output) => (output ? 'true' : 'false'),
            }),
          ),
        ),
        name: Schema.String,
        note: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
