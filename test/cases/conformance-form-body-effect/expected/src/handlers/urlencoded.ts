import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema } from 'effect'
import { CountSchema, FlagSchema, FieldsResponse } from '../components'

export const urlencodedHandler = new Hono().post(
  '/urlencoded',
  describeRoute({ operationId: 'urlencoded', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        name: Schema.optional(Schema.String),
        age: Schema.optional(Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0))),
        ratio: Schema.optional(Schema.Number),
        big: Schema.optional(Schema.Number.check(Schema.isInt())),
        active: Schema.optional(Schema.Boolean),
        level: Schema.optional(Schema.Literals([1, 2])),
        agreed: Schema.optional(Schema.Literal(true)),
        limit: Schema.Number.check(Schema.isInt()).pipe(
          Schema.withDecodingDefault(Effect.succeed(20)),
        ),
        count: Schema.optional(CountSchema),
        flag: Schema.optional(FlagSchema),
        tags: Schema.optional(Schema.Array(Schema.String)),
        ids: Schema.optional(Schema.Array(Schema.Number.check(Schema.isInt()))),
        moment: Schema.optional(
          Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
        ),
        clock: Schema.optional(Schema.String.check(Schema.isPattern(/^\d{2}:\d{2}:\d{2}/))),
        maybe: Schema.optional(Schema.NullOr(Schema.Number.check(Schema.isInt()))),
        label: Schema.optional(Schema.NullOr(Schema.String)),
        constructor: Schema.optional(Schema.Number.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
