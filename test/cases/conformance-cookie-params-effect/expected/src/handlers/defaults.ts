import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema } from 'effect'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'cookieDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        int_def: Schema.Number.check(Schema.isInt()).pipe(
          Schema.withDecodingDefault(Effect.succeed(20)),
        ),
        int64_def: Schema.Number.check(Schema.isInt()).pipe(
          Schema.withDecodingDefault(Effect.succeed(5)),
        ),
        bool_def: Schema.Boolean.pipe(Schema.withDecodingDefault(Effect.succeed(false))),
        str_def: Schema.String.pipe(Schema.withDecodingDefault(Effect.succeed('fallback'))),
      }),
    ),
  ),
  (c) => {},
)
