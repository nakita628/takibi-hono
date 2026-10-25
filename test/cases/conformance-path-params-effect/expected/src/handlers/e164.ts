import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const e164Handler = new Hono().get(
  '/e164/:value',
  describeRoute({ operationId: 'e164Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({ value: Schema.String.check(Schema.isPattern(/^\+[1-9]\d{6,14}$/)) }),
    ),
  ),
  (c) => {},
)
