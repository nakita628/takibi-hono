import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const urlencodedHandler = new Hono().post(
  '/urlencoded',
  describeRoute({ operationId: 'urlencoded', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    Schema.toStandardSchemaV1(
      Schema.Unknown.pipe(
        Schema.decodeTo(
          Schema.Unknown,
          SchemaTransformation.transform<unknown, unknown>({
            decode: (input) =>
              typeof input === 'object' && input !== null && !Array.isArray(input)
                ? Object.assign(Object.create(null), input)
                : input,
            encode: (output) => output,
          }),
        ),
        Schema.decodeTo(
          Schema.Struct({
            name: Schema.optional(Schema.String),
            age: Schema.optional(
              Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
            ),
            ratio: Schema.optional(Schema.FiniteFromString),
            big: Schema.optional(
              Schema.BigIntFromString.check(
                Schema.isBetweenBigInt({
                  minimum: -9223372036854775808n,
                  maximum: 9223372036854775807n,
                }),
              ),
            ),
            active: Schema.optional(
              Schema.String.check(
                Schema.isPattern(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
              ).pipe(
                Schema.decodeTo(
                  Schema.Boolean,
                  SchemaTransformation.transform({
                    decode: (input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input),
                    encode: (output) => (output ? 'true' : 'false'),
                  }),
                ),
              ),
            ),
            level: Schema.optional(
              Schema.FiniteFromString.pipe(Schema.decodeTo(Schema.Literals([1, 2]))),
            ),
            agreed: Schema.optional(
              Schema.String.check(
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
                .pipe(Schema.decodeTo(Schema.Literal(true))),
            ),
            limit: Schema.FiniteFromString.check(Schema.isInt()).pipe(
              Schema.withDecodingDefaultType(Effect.succeed(20)),
            ),
            count: Schema.optional(
              Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
            ),
            flag: Schema.optional(
              Schema.String.check(
                Schema.isPattern(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
              ).pipe(
                Schema.decodeTo(
                  Schema.Boolean,
                  SchemaTransformation.transform({
                    decode: (input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input),
                    encode: (output) => (output ? 'true' : 'false'),
                  }),
                ),
              ),
            ),
            tags: Schema.optional(
              Schema.Unknown.pipe(
                Schema.decodeTo(
                  Schema.Unknown,
                  SchemaTransformation.transform<unknown, unknown>({
                    decode: (input) =>
                      input === undefined || Array.isArray(input) ? input : [input],
                    encode: (output) => output,
                  }),
                ),
                Schema.decodeTo(Schema.Array(Schema.String)),
              ),
            ),
            ids: Schema.optional(
              Schema.Unknown.pipe(
                Schema.decodeTo(
                  Schema.Unknown,
                  SchemaTransformation.transform<unknown, unknown>({
                    decode: (input) =>
                      input === undefined || Array.isArray(input) ? input : [input],
                    encode: (output) => output,
                  }),
                ),
                Schema.decodeTo(Schema.Array(Schema.FiniteFromString.check(Schema.isInt()))),
              ),
            ),
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
            maybe: Schema.optional(
              Schema.Unknown.pipe(
                Schema.decodeTo(
                  Schema.Unknown,
                  SchemaTransformation.transform<unknown, unknown>({
                    decode: (input) => (input === 'null' ? null : input),
                    encode: (output) => output,
                  }),
                ),
                Schema.decodeTo(Schema.NullOr(Schema.FiniteFromString.check(Schema.isInt()))),
              ),
            ),
            label: Schema.optional(Schema.NullOr(Schema.String)),
            constructor: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
          }),
        ),
      ),
    ),
  ),
  (c) => {},
)
