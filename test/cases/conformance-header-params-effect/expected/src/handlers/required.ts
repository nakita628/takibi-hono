import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'headerRequired', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        'x-id': Schema.Number.check(Schema.isInt()),
        'x-big': Schema.Number.check(Schema.isInt()),
        'x-flag': Schema.Boolean,
        'x-name': Schema.String,
        'x-note': Schema.optional(Schema.Number.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
