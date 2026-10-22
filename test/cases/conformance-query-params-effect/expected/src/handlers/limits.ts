import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const limitsHandler = new Hono().get(
  '/limits',
  describeRoute({ operationId: 'queryLimits', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        range: Schema.optional(
          Schema.NumberFromString.check(
            Schema.isInt(),
            Schema.isGreaterThanOrEqualTo(1),
            Schema.isLessThanOrEqualTo(100),
          ),
        ),
        exclusive: Schema.optional(
          Schema.NumberFromString.check(Schema.isGreaterThan(0), Schema.isLessThan(1)),
        ),
        multiple: Schema.optional(
          Schema.NumberFromString.check(Schema.isInt(), Schema.isMultipleOf(5)),
        ),
        int64range: Schema.optional(
          Schema.NumberFromString.check(
            Schema.isInt(),
            Schema.isGreaterThanOrEqualTo(1),
            Schema.isLessThanOrEqualTo(100),
          ),
        ),
        length: Schema.optional(Schema.String.check(Schema.isMinLength(2), Schema.isMaxLength(4))),
        pattern: Schema.optional(Schema.String.check(Schema.isPattern(/^[a-z]+-\d{1,3}$/))),
        items: Schema.optional(
          Schema.Array(Schema.NumberFromString.check(Schema.isInt())).check(
            Schema.isMinLength(2),
            Schema.isMaxLength(3),
          ),
        ),
        unique: Schema.optional(
          Schema.Array(Schema.NumberFromString.check(Schema.isInt())).check(Schema.isUnique()),
        ),
        ranged_items: Schema.optional(
          Schema.Array(
            Schema.NumberFromString.check(
              Schema.isInt(),
              Schema.isGreaterThanOrEqualTo(1),
              Schema.isLessThanOrEqualTo(9),
            ),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
