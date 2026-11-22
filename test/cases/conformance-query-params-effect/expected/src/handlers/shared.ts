import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const sharedHandler = new Hono().get(
  '/shared',
  describeRoute({ operationId: 'queryShared', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        filter: Schema.optionalKey(
          Schema.Struct({
            name: Schema.optionalKey(Schema.String),
            age: Schema.optionalKey(
              Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                .pipe(
                  Schema.decodeTo(
                    Schema.Finite,
                    SchemaTransformation.transform({
                      decode: (input) => Number(input),
                      encode: (output) => String(output),
                    }),
                  ),
                )
                .check(Schema.isInt()),
            ),
          }),
        ),
        sort: Schema.optionalKey(
          Schema.Struct({
            name: Schema.optionalKey(Schema.String),
            dir: Schema.optionalKey(Schema.Literals(['asc', 'desc'])),
          }),
        ),
      }),
    ),
  ),
  (c) => {},
)
