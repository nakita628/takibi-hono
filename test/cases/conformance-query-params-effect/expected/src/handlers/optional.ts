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
      Schema.Struct({
        int_opt: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
        int64_opt: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
        num_opt: Schema.optional(Schema.NumberFromString),
        bool_opt: Schema.optional(
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
        str_opt: Schema.optional(Schema.String),
        uuid_opt: Schema.optional(Schema.String.check(Schema.isUUID())),
        arr_opt: Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        'page-size': Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
        'filter[name]': Schema.optional(Schema.String),
        $top: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
        'user.id': Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
        'ids[]': Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        Int_Opt: Schema.optional(Schema.String),
        constructor: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
