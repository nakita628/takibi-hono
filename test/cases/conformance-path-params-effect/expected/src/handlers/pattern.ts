import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const patternHandler = new Hono().get(
  '/pattern/:value',
  describeRoute({ operationId: 'patternParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({ value: Schema.String.check(Schema.isPattern(/^[a-z]+-\d{1,3}$/)) }),
    ),
  ),
  (c) => {},
)
