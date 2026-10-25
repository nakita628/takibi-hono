import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'queryOptional', responses: { '200': FieldsResponse } }),
  validator(
    'query',
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
            int_opt: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
            int64_opt: Schema.optional(
              Schema.BigIntFromString.check(
                Schema.isBetweenBigInt({
                  minimum: -9223372036854775808n,
                  maximum: 9223372036854775807n,
                }),
              ),
            ),
            num_opt: Schema.optional(Schema.FiniteFromString),
            bool_opt: Schema.optional(
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
            str_opt: Schema.optional(Schema.String),
            uuid_opt: Schema.optional(Schema.String.check(Schema.isUUID())),
            arr_opt: Schema.optional(
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
            'page-size': Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
            'filter[name]': Schema.optional(Schema.String),
            $top: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
            'user.id': Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
            'ids[]': Schema.optional(
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
            Int_Opt: Schema.optional(Schema.String),
            constructor: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
          }),
        ),
      ),
    ),
  ),
  (c) => {},
)
