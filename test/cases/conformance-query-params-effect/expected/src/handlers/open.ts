import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const openHandler = new Hono().get(
  '/open',
  describeRoute({ operationId: 'queryOpen', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        page: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
        extra: Schema.optional(
          Schema.Record(Schema.String, Schema.NumberFromString.check(Schema.isInt())),
        ),
      }),
    ),
  ),
  (c) => {},
)
