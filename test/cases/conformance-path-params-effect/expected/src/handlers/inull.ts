import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { EchoResponse } from '../components'

export const inullHandler = new Hono().get(
  '/inull/:value',
  describeRoute({ operationId: 'inullParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.Unknown.pipe(
          Schema.decodeTo(
            Schema.Unknown,
            SchemaTransformation.transform<unknown, unknown>({
              decode: (input) => (input === 'null' ? null : input),
              encode: (output) => output,
            }),
          ),
          Schema.decodeTo(Schema.NullOr(Schema.FiniteFromString.check(Schema.isInt()))),
        ),
      }),
    ),
  ),
  (c) => {},
)
