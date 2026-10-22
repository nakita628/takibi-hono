import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const ipv6Handler = new Hono().get(
  '/ipv6/:value',
  describeRoute({ operationId: 'ipv6Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.String.check(Schema.isPattern(/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)),
      }),
    ),
  ),
  (c) => {},
)
