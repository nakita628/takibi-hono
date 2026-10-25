import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const openHandler = new Hono().get(
  '/open',
  describeRoute({ operationId: 'cookieOpen', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        page: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
        bag: Schema.optional(
          Schema.Record(Schema.String, Schema.FiniteFromString.check(Schema.isInt())),
        ),
      }),
    ),
  ),
  (c) => {},
)
