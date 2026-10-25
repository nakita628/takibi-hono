import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { NameSchema, FieldsResponse } from '../components'

export const refsHandler = new Hono().get(
  '/refs',
  describeRoute({ operationId: 'queryRefs', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        ref_int: Schema.optional(
          Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
        ),
        ref_big: Schema.optional(
          Schema.BigIntFromString.check(
            Schema.isBetweenBigInt({
              minimum: -9223372036854775808n,
              maximum: 9223372036854775807n,
            }),
          ),
        ),
        ref_num: Schema.optional(Schema.FiniteFromString),
        ref_bool: Schema.optional(
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
        ref_enum: Schema.optional(
          Schema.FiniteFromString.pipe(Schema.decodeTo(Schema.Literals([1, 2, 3]))),
        ),
        ref_str: Schema.optional(NameSchema),
        ref_arr: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(Schema.Array(Schema.FiniteFromString.check(Schema.isInt()))),
          ),
        ),
        arr_ref: Schema.optional(
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
                Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
              ),
            ),
          ),
        ),
        allof_ref: Schema.optional(
          Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)).annotate({
            description: 'A count.',
          }),
        ),
        ref_ref: Schema.optional(
          Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
        ),
      }),
    ),
  ),
  (c) => {},
)
