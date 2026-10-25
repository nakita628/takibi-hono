import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { EchoResponse } from '../components'

export const txnormalizeHandler = new Hono().get(
  '/txnormalize/:value',
  describeRoute({ operationId: 'txnormalizeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.String.pipe(
          Schema.decodeTo(
            Schema.String,
            SchemaTransformation.transform({
              decode: (input) => input.normalize('NFKC'),
              encode: (output) => output,
            }),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
