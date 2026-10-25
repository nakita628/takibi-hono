import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const uint64Handler = new Hono().get(
  '/uint64/:value',
  describeRoute({ operationId: 'uint64Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.BigIntFromString.check(
          Schema.isBetweenBigInt({ minimum: 0n, maximum: 18446744073709551615n }),
        ),
      }),
    ),
  ),
  (c) => {},
)
