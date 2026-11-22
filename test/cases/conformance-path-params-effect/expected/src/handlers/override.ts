import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { EchoResponse } from '../components'

export const overrideHandler = new Hono().get(
  '/override/:id',
  describeRoute({ operationId: 'overrideParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        id: Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
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
      }),
    ),
  ),
  (c) => {},
)
