import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { EchoResponse } from '../components'

export const txlowerHandler = new Hono().get(
  '/txlower/:value',
  describeRoute({ operationId: 'txlowerParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.String.pipe(
          Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase()),
        ),
      }),
    ),
  ),
  (c) => {},
)
