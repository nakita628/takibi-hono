import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const typesHandler = new Hono().post(
  '/types',
  describeRoute({ operationId: 'types', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        either: Schema.optional(Schema.String),
        flagged: Schema.optional(Schema.NullOr(Schema.Number)),
        bounded: Schema.optional(Schema.String.check(Schema.isMinLength(2))),
        moment: Schema.optional(
          Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
        ),
        clock: Schema.optional(Schema.String.check(Schema.isPattern(/^\d{2}:\d{2}:\d{2}/))),
        inherited: Schema.optional(
          Schema.Struct({
            constructor: Schema.optional(Schema.Number.check(Schema.isInt())),
            name: Schema.optional(Schema.String),
          }),
        ),
        labelled: Schema.optional(
          Schema.Record(Schema.String, Schema.Number.check(Schema.isInt())),
        ),
      }),
    ),
  ),
  (c) => {},
)
