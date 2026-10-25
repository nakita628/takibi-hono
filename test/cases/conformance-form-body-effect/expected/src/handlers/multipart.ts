import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const multipartHandler = new Hono().post(
  '/multipart',
  describeRoute({ operationId: 'multipart', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        file: Schema.instanceOf(File),
        age: Schema.optional(Schema.Number.check(Schema.isInt())),
        active: Schema.optional(Schema.Boolean),
        ids: Schema.optional(Schema.Array(Schema.Number.check(Schema.isInt()))),
      }),
    ),
  ),
  (c) => {},
)
