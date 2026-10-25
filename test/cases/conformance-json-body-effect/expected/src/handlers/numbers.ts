import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema, SchemaTransformation } from 'effect'
import { IdSchema, FieldsResponse } from '../components'

export const numbersHandler = new Hono().post(
  '/numbers',
  describeRoute({ operationId: 'numbers', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        id: Schema.optional(
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
        unsigned: Schema.optional(
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
            .check(Schema.isBetweenBigInt({ minimum: 0n, maximum: 18446744073709551615n })),
        ),
        ranged: Schema.optional(
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
              Schema.isGreaterThanOrEqualToBigInt(1n),
              Schema.isLessThanOrEqualToBigInt(100n),
            ),
        ),
        level: Schema.optional(
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
            .pipe(Schema.decodeTo(Schema.Literals([1n, 2n]))),
        ),
        version: Schema.optional(
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
            .pipe(Schema.decodeTo(Schema.Literal(5n))),
        ),
        cursor: Schema.Union([
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
          )
          .pipe(Schema.withDecodingDefault(Effect.succeed(0n))),
        maybe: Schema.optional(
          Schema.NullOr(
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
        ),
        ids: Schema.optional(
          Schema.Array(
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
        ),
        small: Schema.optional(Schema.Number.check(Schema.isInt32())),
        ref: Schema.optional(IdSchema),
      }),
    ),
  ),
  (c) => {},
)
