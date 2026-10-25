import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'headerRequired', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        'x-id': Schema.Number.check(Schema.isInt()),
        'x-big': Schema.Union([
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
        'x-flag': Schema.Boolean,
        'x-name': Schema.String,
        'x-note': Schema.optional(Schema.Number.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
