import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { EchoResponse } from '../components'

export const txupperHandler = new Hono().get(
  '/txupper/:value',
  describeRoute({ operationId: 'txupperParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.String.pipe(
          Schema.decodeTo(Schema.String, SchemaTransformation.toUpperCase()),
        ),
      }),
    ),
  ),
  (c) => {},
)
