import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const floatHandler = new Hono().get(
  '/float/:value',
  describeRoute({ operationId: 'floatParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.FiniteFromString.check(
          Schema.isBetween({ minimum: -3.4028234663852886e38, maximum: 3.4028234663852886e38 }),
        ),
      }),
    ),
  ),
  (c) => {},
)
