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
      Schema.Struct({
        toString: Schema.String,
        valueOf: Schema.NumberFromString.check(Schema.isInt()).pipe(
          Schema.withDecodingDefault(Effect.succeed(3)),
        ),
        hasOwnProperty: Schema.optional(
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
        isPrototypeOf: Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        toLocaleString: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
