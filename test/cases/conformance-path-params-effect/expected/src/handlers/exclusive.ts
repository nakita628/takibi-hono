import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const exclusiveHandler = new Hono().get(
  '/exclusive/:value',
  describeRoute({ operationId: 'exclusiveParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.FiniteFromString.check(Schema.isGreaterThan(0), Schema.isLessThan(1)),
      }),
    ),
  ),
  (c) => {},
)
