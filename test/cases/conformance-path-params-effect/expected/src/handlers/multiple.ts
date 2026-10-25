import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const multipleHandler = new Hono().get(
  '/multiple/:value',
  describeRoute({ operationId: 'multipleParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.FiniteFromString.check(Schema.isInt(), Schema.isMultipleOf(5)),
      }),
    ),
  ),
  (c) => {},
)
