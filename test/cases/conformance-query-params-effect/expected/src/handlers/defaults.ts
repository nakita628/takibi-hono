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
        int_def: Schema.NumberFromString.check(Schema.isInt()).pipe(
          Schema.withDecodingDefault(Effect.succeed(20)),
        ),
        int64_def: Schema.NumberFromString.check(Schema.isInt()).pipe(
          Schema.withDecodingDefault(Effect.succeed(5)),
        ),
        num_def: Schema.NumberFromString.pipe(Schema.withDecodingDefault(Effect.succeed(0.5))),
        bool_def: Schema.Literals(['true', 'false'])
          .pipe(
            Schema.decodeTo(
              Schema.Boolean,
              SchemaTransformation.transform({
                decode: (input) => input === 'true',
                encode: (input) => (input ? 'true' : 'false'),
              }),
            ),
          )
          .pipe(Schema.withDecodingDefault(Effect.succeed(false))),
        bool_def_true: Schema.Literals(['true', 'false'])
          .pipe(
            Schema.decodeTo(
              Schema.Boolean,
              SchemaTransformation.transform({
                decode: (input) => input === 'true',
                encode: (input) => (input ? 'true' : 'false'),
              }),
            ),
          )
          .pipe(Schema.withDecodingDefault(Effect.succeed(true))),
        str_def: Schema.String.pipe(Schema.withDecodingDefault(Effect.succeed('fallback'))),
        enum_def: Schema.Literals(['asc', 'desc']).pipe(
          Schema.withDecodingDefault(Effect.succeed('asc')),
        ),
        arr_def: Schema.Array(Schema.String).pipe(Schema.withDecodingDefault(Effect.succeed([]))),
        arr_int_def: Schema.Array(Schema.NumberFromString.check(Schema.isInt())).pipe(
          Schema.withDecodingDefault(Effect.succeed([1, 2])),
        ),
      }),
    ),
  ),
  (c) => {},
)
