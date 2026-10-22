import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const lengthHandler = new Hono().get(
  '/length/:value',
  describeRoute({ operationId: 'lengthParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({ value: Schema.String.check(Schema.isMinLength(2), Schema.isMaxLength(4)) }),
    ),
  ),
  (c) => {},
)
