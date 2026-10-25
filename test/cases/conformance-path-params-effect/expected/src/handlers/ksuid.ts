import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const ksuidHandler = new Hono().get(
  '/ksuid/:value',
  describeRoute({ operationId: 'ksuidParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({ value: Schema.String.check(Schema.isPattern(/^[A-Za-z0-9]{27}$/)) }),
    ),
  ),
  (c) => {},
)
