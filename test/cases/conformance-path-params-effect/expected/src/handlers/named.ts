import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const namedHandler = new Hono().get(
  '/named/:user-id/:post_id',
  describeRoute({ operationId: 'namedParam', responses: { '200': FieldsResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        'user-id': Schema.NumberFromString.check(Schema.isInt()),
        post_id: Schema.Literals(['true', 'false']).pipe(
          Schema.decodeTo(
            Schema.Boolean,
            SchemaTransformation.transform({
              decode: (input) => input === 'true',
              encode: (input) => (input ? 'true' : 'false'),
            }),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
