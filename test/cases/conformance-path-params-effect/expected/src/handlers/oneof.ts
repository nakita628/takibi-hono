import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const oneofHandler = new Hono().get(
  '/oneof/:value',
  describeRoute({ operationId: 'oneofParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.Union([Schema.NumberFromString.check(Schema.isInt()), Schema.Literal('all')]),
      }),
    ),
  ),
  (c) => {},
)
