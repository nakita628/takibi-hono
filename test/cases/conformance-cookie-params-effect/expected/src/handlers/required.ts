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
        id: Schema.Number.check(Schema.isInt()),
        big: Schema.Union([
          Schema.BigInt,
          Schema.Number.check(Schema.isInt()),
          Schema.String.check(Schema.isPattern(/^-?\d+$/)),
        ])
          .pipe(
            Schema.decodeTo(
              Schema.BigInt,
              SchemaTransformation.transform({
                decode: (input) => BigInt(input),
                encode: (output) => output,
              }),
            ),
          )
          .check(
            Schema.isBetweenBigInt({
              minimum: -9223372036854775808n,
              maximum: 9223372036854775807n,
            }),
          ),
        flag: Schema.Boolean,
        name: Schema.String,
        note: Schema.optional(Schema.Number.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
