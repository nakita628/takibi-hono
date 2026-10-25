import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema } from 'effect'
import { FieldsResponse } from '../components'

export const absentHandler = new Hono().get(
  '/absent',
  describeRoute({ operationId: 'queryAbsent', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        empty_ok: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
        empty_def: Schema.FiniteFromString.check(Schema.isInt()).pipe(
          Schema.withDecodingDefaultType(Effect.succeed(7)),
        ),
        empty_str: Schema.optional(Schema.String),
        ref_def: Schema.FiniteFromString.check(
          Schema.isInt(),
          Schema.isGreaterThanOrEqualTo(0),
        ).pipe(Schema.withDecodingDefaultType(Effect.succeed(3))),
      }),
    ),
  ),
  (c) => {},
)
