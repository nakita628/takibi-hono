import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'cookieDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        int_def: Schema.FiniteFromString.check(Schema.isInt()).pipe(
          Schema.withDecodingDefaultType(Effect.succeed(20)),
        ),
        int64_def: Schema.BigIntFromString.check(
          Schema.isBetweenBigInt({ minimum: -9223372036854775808n, maximum: 9223372036854775807n }),
        ).pipe(Schema.withDecodingDefaultType(Effect.succeed(5n))),
        bool_def: Schema.String.check(
          Schema.isPattern(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
        )
          .pipe(
            Schema.decodeTo(
              Schema.Boolean,
              SchemaTransformation.transform({
                decode: (input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input),
                encode: (output) => (output ? 'true' : 'false'),
              }),
            ),
          )
          .pipe(Schema.withDecodingDefaultType(Effect.succeed(false))),
        str_def: Schema.String.pipe(Schema.withDecodingDefaultType(Effect.succeed('fallback'))),
      }),
    ),
  ),
  (c) => {},
)
