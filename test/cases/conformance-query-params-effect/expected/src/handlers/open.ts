import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const openHandler = new Hono().get(
  '/open',
  describeRoute({ operationId: 'queryOpen', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        page: Schema.optionalKey(
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
        extra: Schema.optionalKey(
          Schema.StructWithRest(Schema.Struct({ known: Schema.optionalKey(Schema.String) }), [
            Schema.Record(Schema.String, Schema.Unknown),
          ]).check(
            Schema.makeFilter((input) =>
              Object.entries(input).every(
                ([key, value]) =>
                  ['known'].includes(key) ||
                  Schema.is(
                    Schema.toEncoded(
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
                  )(value),
              ),
            ),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
