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
              Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
            ),
            active: Schema.optional(
              Schema.Literals(['true', 'false']).pipe(
                Schema.decodeTo(
                  Schema.Boolean,
                  SchemaTransformation.transform({
                    decode: (input) => input === 'true',
                    encode: (input) => (input ? 'true' : 'false'),
                  }),
                ),
              ),
            ),
            ids: Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
            points: Schema.optional(
              Schema.Array(
                Schema.Struct({
                  x: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
                  y: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
                }),
              ),
            ),
            tags: Schema.optional(Schema.Array(Schema.String)),
            range: Schema.optional(
              Schema.Struct({
                min: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
                max: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
              }),
            ),
          }),
        ),
        deep_ref: Schema.optional(RangeSchema),
        spread: Schema.optional(
          Schema.Struct({
            sort: Schema.optional(Schema.Literals(['asc', 'desc'])),
            size: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
            page: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
          }),
        ),
        pairs: Schema.optional(
          Schema.Struct({
            name: Schema.optional(Schema.String),
            age: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
          }),
        ),
        page: Schema.optional(Schema.String),
        limit: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
