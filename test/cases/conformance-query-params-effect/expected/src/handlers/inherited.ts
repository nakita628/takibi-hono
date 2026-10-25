import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Effect, Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const inheritedHandler = new Hono().get(
  '/inherited',
  describeRoute({ operationId: 'queryInherited', responses: { '200': FieldsResponse } }),
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
            toString: Schema.String,
            valueOf: Schema.FiniteFromString.check(Schema.isInt()).pipe(
              Schema.withDecodingDefaultType(Effect.succeed(3)),
            ),
            hasOwnProperty: Schema.optional(
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
            isPrototypeOf: Schema.optional(
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
            toLocaleString: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
          }),
        ),
      ),
    ),
  ),
  (c) => {},
)
