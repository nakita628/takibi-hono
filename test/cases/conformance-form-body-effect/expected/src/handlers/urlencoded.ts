import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema, SchemaTransformation } from 'effect'
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
        big: Schema.optional(
          Schema.Union([
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
        ),
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
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
            ),
          ),
        ),
        clock: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
            ),
          ),
        ),
        maybe: Schema.optional(Schema.NullOr(Schema.Number.check(Schema.isInt()))),
        label: Schema.optional(Schema.NullOr(Schema.String)),
        constructor: Schema.optional(Schema.Number.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
