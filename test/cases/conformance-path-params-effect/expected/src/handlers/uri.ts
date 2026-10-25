import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const uriHandler = new Hono().get(
  '/uri/:value',
  describeRoute({ operationId: 'uriParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.String.check(Schema.makeFilter((input) => URL.canParse(input))),
      }),
    ),
  ),
  (c) => {},
)
