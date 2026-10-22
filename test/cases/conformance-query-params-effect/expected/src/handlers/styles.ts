import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const stylesHandler = new Hono().get(
  '/styles',
  describeRoute({ operationId: 'queryStyles', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        csv: Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        pipes: Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        spaces: Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        filter: Schema.optional(
          Schema.Struct({
            name: Schema.optional(Schema.String),
            age: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
          }),
        ),
        csv_str: Schema.optional(Schema.Array(Schema.String)),
      }),
    ),
  ),
  (c) => {},
)
