import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const int64rangeHandler = new Hono().get(
  '/int64range/:value',
  describeRoute({ operationId: 'int64rangeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.NumberFromString.check(
          Schema.isInt(),
          Schema.isGreaterThanOrEqualTo(1),
          Schema.isLessThanOrEqualTo(100),
        ),
      }),
    ),
  ),
  (c) => {},
)
