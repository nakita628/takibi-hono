import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { EchoResponse } from '../components'

export const txemailHandler = new Hono().get(
  '/txemail/:value',
  describeRoute({ operationId: 'txemailParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.String.pipe(
          Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase()),
        ).check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
      }),
    ),
  ),
  (c) => {},
)
