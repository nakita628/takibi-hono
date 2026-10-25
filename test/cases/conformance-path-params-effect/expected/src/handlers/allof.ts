import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const allofHandler = new Hono().get(
  '/allof/:value',
  describeRoute({ operationId: 'allofParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.FiniteFromString.check(Schema.isInt()).check(
          Schema.makeFilter((input) =>
            Schema.is(Schema.FiniteFromString.check(Schema.isGreaterThanOrEqualTo(5)))(input),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
