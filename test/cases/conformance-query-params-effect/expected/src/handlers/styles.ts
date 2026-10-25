import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const stylesHandler = new Hono().get(
  '/styles',
  describeRoute({ operationId: 'queryStyles', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        csv: Schema.optional(
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
        pipes: Schema.optional(
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
        spaces: Schema.optional(
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
        filter: Schema.optional(
          Schema.Struct({
            name: Schema.optional(Schema.String),
            age: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
          }),
        ),
        csv_str: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(Schema.Array(Schema.String)),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
