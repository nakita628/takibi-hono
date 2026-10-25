import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'headerDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        'x-int-def': Schema.Number.check(Schema.isInt()).pipe(
          Schema.withDecodingDefault(Effect.succeed(20)),
        ),
        'x-int64-def': Schema.Union([
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
          )
          .pipe(Schema.withDecodingDefault(Effect.succeed(5n))),
        'x-bool-def': Schema.Boolean.pipe(Schema.withDecodingDefault(Effect.succeed(false))),
        'x-str-def': Schema.String.pipe(Schema.withDecodingDefault(Effect.succeed('fallback'))),
      }),
    ),
  ),
  (c) => {},
)
