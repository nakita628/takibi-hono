import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const sharedHandler = new Hono().get(
  '/shared',
  describeRoute({ operationId: 'queryShared', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        filter: Schema.optional(
          Schema.Struct({
            name: Schema.optional(Schema.String),
            age: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
          }),
        ),
        sort: Schema.optional(
          Schema.Struct({
            name: Schema.optional(Schema.String),
            dir: Schema.optional(Schema.Literals(['asc', 'desc'])),
          }),
        ),
      }),
    ),
  ),
  (c) => {},
)
