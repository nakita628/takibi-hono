import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema } from 'effect'
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
        'x-int64-def': Schema.Number.check(Schema.isInt()).pipe(
          Schema.withDecodingDefault(Effect.succeed(5)),
        ),
        'x-bool-def': Schema.Boolean.pipe(Schema.withDecodingDefault(Effect.succeed(false))),
        'x-str-def': Schema.String.pipe(Schema.withDecodingDefault(Effect.succeed('fallback'))),
      }),
    ),
  ),
  (c) => {},
)
