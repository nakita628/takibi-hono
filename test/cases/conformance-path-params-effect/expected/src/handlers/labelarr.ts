import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const labelarrHandler = new Hono().get(
  '/labelarr/:value',
  describeRoute({ operationId: 'labelarrParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({ value: Schema.Array(Schema.NumberFromString.check(Schema.isInt())) }),
    ),
  ),
  (c) => {},
)
