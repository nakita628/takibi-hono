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
        value: Schema.BigIntFromString.check(
          Schema.isBetweenBigInt({ minimum: -9223372036854775808n, maximum: 9223372036854775807n }),
          Schema.isGreaterThanOrEqualToBigInt(1n),
          Schema.isLessThanOrEqualToBigInt(100n),
        ),
      }),
    ),
  ),
  (c) => {},
)
