import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { EchoResponse } from '../components'

export const booleanHandler = new Hono().get(
  '/boolean/:value',
  describeRoute({ operationId: 'booleanParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.String.check(
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
      }),
    ),
  ),
  (c) => {},
)
