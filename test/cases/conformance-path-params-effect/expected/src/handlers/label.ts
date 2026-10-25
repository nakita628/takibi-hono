import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const labelHandler = new Hono().get(
  '/label/:value',
  describeRoute({ operationId: 'labelParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({ value: Schema.FiniteFromString.check(Schema.isInt()) }),
    ),
  ),
  (c) => {},
)
