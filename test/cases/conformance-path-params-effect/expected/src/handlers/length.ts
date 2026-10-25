import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { EchoResponse } from '../components'

export const lengthHandler = new Hono().get(
  '/length/:value',
  describeRoute({ operationId: 'lengthParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        value: Schema.String.check(
          Schema.makeFilter((input) => [...input].length >= 2, {
            expected: 'a string of at least 2 characters',
          }),
          Schema.makeFilter((input) => [...input].length <= 4, {
            expected: 'a string of at most 4 characters',
          }),
        ),
      }),
    ),
  ),
  (c) => {},
)
