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
        either: Schema.optional(Schema.Union([Schema.Number.check(Schema.isInt()), Schema.String])),
        flagged: Schema.optional(Schema.NullOr(Schema.Union([Schema.Number, Schema.Boolean]))),
        bounded: Schema.optional(
          Schema.Union([
            Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
            Schema.String.check(
              Schema.makeFilter((input) => [...input].length >= 2, {
                expected: 'a string of at least 2 characters',
              }),
            ),
          ]),
        ),
        moment: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
            ),
          ),
        ),
        clock: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
            ),
          ),
        ),
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
