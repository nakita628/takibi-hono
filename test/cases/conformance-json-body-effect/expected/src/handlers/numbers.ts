import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema } from 'effect'
import { IdSchema, FieldsResponse } from '../components'

export const numbersHandler = new Hono().post(
  '/numbers',
  describeRoute({ operationId: 'numbers', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        id: Schema.optional(Schema.Number.check(Schema.isInt())),
        unsigned: Schema.optional(Schema.Number.check(Schema.isInt())),
        ranged: Schema.optional(
          Schema.Number.check(
            Schema.isInt(),
            Schema.isGreaterThanOrEqualTo(1),
            Schema.isLessThanOrEqualTo(100),
          ),
        ),
        level: Schema.optional(Schema.Literals([1, 2])),
        version: Schema.optional(Schema.Literal(5)),
        cursor: Schema.Number.check(Schema.isInt()).pipe(
          Schema.withDecodingDefault(Effect.succeed(0)),
        ),
        maybe: Schema.optional(Schema.NullOr(Schema.Number.check(Schema.isInt()))),
        ids: Schema.optional(Schema.Array(Schema.Number.check(Schema.isInt()))),
        small: Schema.optional(Schema.Number.check(Schema.isInt())),
        ref: Schema.optional(IdSchema),
      }),
    ),
  ),
  (c) => {},
)
