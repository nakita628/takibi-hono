import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const oneofisHandler = new Hono().get(
  '/oneofis/:value',
  describeRoute({ operationId: 'oneofisParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.Union([Schema.FiniteFromString.check(Schema.isInt()), Schema.String]),
      }),
    ),
  ),
  (c) => {},
)
