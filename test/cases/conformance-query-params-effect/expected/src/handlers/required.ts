import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'queryRequired', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        id: Schema.NumberFromString.check(Schema.isInt()),
        big: Schema.NumberFromString.check(Schema.isInt()),
        flag: Schema.Literals(['true', 'false']).pipe(
          Schema.decodeTo(
            Schema.Boolean,
            SchemaTransformation.transform({
              decode: (input) => input === 'true',
              encode: (input) => (input ? 'true' : 'false'),
            }),
          ),
        ),
        name: Schema.String,
        tags: Schema.Array(Schema.NumberFromString.check(Schema.isInt())),
        note: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
