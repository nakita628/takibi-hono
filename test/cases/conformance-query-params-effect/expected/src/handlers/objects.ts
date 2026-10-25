import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { RangeSchema, FieldsResponse } from '../components'

export const objectsHandler = new Hono().get(
  '/objects',
  describeRoute({ operationId: 'queryObjects', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        deep: Schema.optional(
          Schema.Struct({
            name: Schema.optional(Schema.String),
            age: Schema.optional(
              Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
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
            points: Schema.optional(
              Schema.Unknown.pipe(
                Schema.decodeTo(
                  Schema.Unknown,
                  SchemaTransformation.transform<unknown, unknown>({
                    decode: (input) =>
                      input === undefined || Array.isArray(input) ? input : [input],
                    encode: (output) => output,
                  }),
                ),
                Schema.decodeTo(
                  Schema.Array(
                    Schema.Struct({
                      x: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
                      y: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
                    }),
                  ),
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
            range: Schema.optional(
              Schema.Struct({
                min: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
                max: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
              }),
            ),
          }),
        ),
        deep_ref: Schema.optional(RangeSchema),
        spread: Schema.optional(
          Schema.Struct({
            sort: Schema.optional(Schema.Literals(['asc', 'desc'])),
            size: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
            page: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
          }),
        ),
        pairs: Schema.optional(
          Schema.Struct({
            name: Schema.optional(Schema.String),
            age: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
          }),
        ),
        page: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
