import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const nanoidHandler = new Hono().get(
  '/nanoid/:value',
  describeRoute({ operationId: 'nanoidParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({ value: Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9_-]{21}$/)) }),
    ),
  ),
  (c) => {},
)
