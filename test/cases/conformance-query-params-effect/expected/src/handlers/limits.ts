import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const limitsHandler = new Hono().get(
  '/limits',
  describeRoute({ operationId: 'queryLimits', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        range: Schema.optional(
          Schema.FiniteFromString.check(
            Schema.isInt(),
            Schema.isGreaterThanOrEqualTo(1),
            Schema.isLessThanOrEqualTo(100),
          ),
        ),
        exclusive: Schema.optional(
          Schema.FiniteFromString.check(Schema.isGreaterThan(0), Schema.isLessThan(1)),
        ),
        multiple: Schema.optional(
          Schema.FiniteFromString.check(Schema.isInt(), Schema.isMultipleOf(5)),
        ),
        int64range: Schema.optional(
          Schema.BigIntFromString.check(
            Schema.isBetweenBigInt({
              minimum: -9223372036854775808n,
              maximum: 9223372036854775807n,
            }),
            Schema.isGreaterThanOrEqualToBigInt(1n),
            Schema.isLessThanOrEqualToBigInt(100n),
          ),
        ),
        length: Schema.optional(
          Schema.String.check(
            Schema.makeFilter((input) => [...input].length >= 2, {
              expected: 'a string of at least 2 characters',
            }),
            Schema.makeFilter((input) => [...input].length <= 4, {
              expected: 'a string of at most 4 characters',
            }),
          ),
        ),
        pattern: Schema.optional(Schema.String.check(Schema.isPattern(/^[a-z]+-\d{1,3}$/))),
        items: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(
              Schema.Array(Schema.FiniteFromString.check(Schema.isInt())).check(
                Schema.isMinLength(2),
                Schema.isMaxLength(3),
              ),
            ),
          ),
        ),
        unique: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(
              Schema.Array(Schema.FiniteFromString.check(Schema.isInt())).check(Schema.isUnique()),
            ),
          ),
        ),
        ranged_items: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(
              Schema.Array(
                Schema.FiniteFromString.check(
                  Schema.isInt(),
                  Schema.isGreaterThanOrEqualTo(1),
                  Schema.isLessThanOrEqualTo(9),
                ),
              ),
            ),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
