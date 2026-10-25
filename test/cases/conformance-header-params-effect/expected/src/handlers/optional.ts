import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { CountSchema, FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'headerOptional', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        'x-int-opt': Schema.optional(Schema.Number.check(Schema.isInt())),
        'x-int64-opt': Schema.optional(
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
        'x-bool-opt': Schema.optional(Schema.Boolean),
        'x-str-opt': Schema.optional(Schema.String),
        'x-ienum': Schema.optional(Schema.Literals([1, 2, 3])),
        'x-benum': Schema.optional(Schema.Literal(true)),
        'x-iconst': Schema.optional(Schema.Literal(7)),
        'x-senum': Schema.optional(Schema.Literals(['asc', 'desc'])),
        'x-ioneof': Schema.optional(
          Schema.Union([Schema.Number.check(Schema.isInt()), Schema.Literal('all')]),
        ),
        'x-range': Schema.optional(
          Schema.Number.check(
            Schema.isInt(),
            Schema.isGreaterThanOrEqualTo(1),
            Schema.isLessThanOrEqualTo(100),
          ),
        ),
        'x-length': Schema.optional(
          Schema.String.check(
            Schema.makeFilter((input) => [...input].length >= 2, {
              expected: 'a string of at least 2 characters',
            }),
            Schema.makeFilter((input) => [...input].length <= 4, {
              expected: 'a string of at most 4 characters',
            }),
          ),
        ),
        'x-pattern': Schema.optional(Schema.String.check(Schema.isPattern(/^[a-z]+-\d{1,3}$/))),
        'x-tx-lower': Schema.optional(
          Schema.String.pipe(Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase())),
        ),
        'x-tx-email': Schema.optional(
          Schema.String.pipe(
            Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase()),
          ).check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
        ),
        'x-ref-int': Schema.optional(CountSchema),
        'x-str-arr': Schema.optional(Schema.Array(Schema.String)),
        'x-obj': Schema.optional(
          Schema.Struct({
            a: Schema.optional(Schema.Number.check(Schema.isInt())),
            b: Schema.optional(Schema.String),
          }),
        ),
        'x-objx': Schema.optional(
          Schema.Struct({
            a: Schema.optional(Schema.Number.check(Schema.isInt())),
            b: Schema.optional(Schema.String),
          }),
        ),
        'X-Request-Id': Schema.optional(Schema.String.check(Schema.isUUID())),
        'X-Rate-Limit': Schema.optional(Schema.Number.check(Schema.isInt())),
        'accept-version': Schema.optional(Schema.Number.check(Schema.isInt())),
        x_underscore: Schema.optional(Schema.Number.check(Schema.isInt())),
        'x-inull': Schema.optional(Schema.NullOr(Schema.Number.check(Schema.isInt()))),
        constructor: Schema.optional(Schema.Number.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
