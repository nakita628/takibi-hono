import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'cookieRequired', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        id: Schema.Number.check(Schema.isInt()),
        big: Schema.Number.check(Schema.isInt()),
        flag: Schema.Boolean,
        name: Schema.String,
        note: Schema.optional(Schema.Number.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
