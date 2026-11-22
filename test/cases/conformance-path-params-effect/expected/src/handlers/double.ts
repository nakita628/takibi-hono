import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { EchoResponse } from '../components'

export const doubleHandler = new Hono().get(
  '/double/:value',
  describeRoute({ operationId: 'doubleParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.String.check(
          Schema.isPattern(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/),
        ).pipe(
          Schema.decodeTo(
            Schema.Finite,
            SchemaTransformation.transform({
              decode: (input) => Number(input),
              encode: (output) => String(output),
            }),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
