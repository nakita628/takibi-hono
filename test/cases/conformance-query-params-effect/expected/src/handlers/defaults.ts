import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'queryDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        int_def: Schema.FiniteFromString.check(Schema.isInt()).pipe(
          Schema.withDecodingDefaultType(Effect.succeed(20)),
        ),
        int64_def: Schema.BigIntFromString.check(
          Schema.isBetweenBigInt({ minimum: -9223372036854775808n, maximum: 9223372036854775807n }),
        ).pipe(Schema.withDecodingDefaultType(Effect.succeed(5n))),
        num_def: Schema.FiniteFromString.pipe(Schema.withDecodingDefaultType(Effect.succeed(0.5))),
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
        bool_def_true: Schema.String.check(
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
          .pipe(Schema.withDecodingDefaultType(Effect.succeed(true))),
        str_def: Schema.String.pipe(Schema.withDecodingDefaultType(Effect.succeed('fallback'))),
        enum_def: Schema.Literals(['asc', 'desc']).pipe(
          Schema.withDecodingDefaultType(Effect.succeed('asc')),
        ),
        arr_def: Schema.Unknown.pipe(
          Schema.decodeTo(
            Schema.Unknown,
            SchemaTransformation.transform<unknown, unknown>({
              decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
              encode: (output) => output,
            }),
          ),
          Schema.decodeTo(Schema.Array(Schema.String)),
        ).pipe(Schema.withDecodingDefaultType(Effect.succeed([]))),
        arr_int_def: Schema.Unknown.pipe(
          Schema.decodeTo(
            Schema.Unknown,
            SchemaTransformation.transform<unknown, unknown>({
              decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
              encode: (output) => output,
            }),
          ),
          Schema.decodeTo(Schema.Array(Schema.FiniteFromString.check(Schema.isInt()))),
        ).pipe(Schema.withDecodingDefaultType(Effect.succeed([1, 2]))),
      }),
    ),
  ),
  (c) => {},
)
