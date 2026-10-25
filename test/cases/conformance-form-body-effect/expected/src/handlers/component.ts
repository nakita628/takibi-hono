import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const componentHandler = new Hono().post(
  '/component',
  describeRoute({ operationId: 'component', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        name: Schema.String,
        price: Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
        stocked: Schema.optional(
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
      }),
    ),
  ),
  (c) => {},
)
