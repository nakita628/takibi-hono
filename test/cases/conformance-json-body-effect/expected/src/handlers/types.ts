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
        either: Schema.optionalKey(
          Schema.Union([Schema.Number.check(Schema.isInt()), Schema.String]),
        ),
        flagged: Schema.optionalKey(Schema.NullOr(Schema.Union([Schema.Number, Schema.Boolean]))),
        bounded: Schema.optionalKey(
          Schema.Union([
            Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
            Schema.String.check(
              Schema.makeFilter((input) => [...input].length >= 2, {
                expected: 'a string of at least 2 characters',
              }),
            ),
          ]),
        ),
        moment: Schema.optionalKey(
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
            ),
          ),
        ),
        clock: Schema.optionalKey(
          Schema.String.check(
            Schema.isPattern(
              /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
            ),
          ),
        ),
        inherited: Schema.optionalKey(
          Schema.Struct({
            constructor: Schema.optionalKey(Schema.Number.check(Schema.isInt())),
            name: Schema.optionalKey(Schema.String),
          }),
        ),
        labelled: Schema.optionalKey(
          Schema.StructWithRest(Schema.Struct({ name: Schema.optionalKey(Schema.String) }), [
            Schema.Record(Schema.String, Schema.Unknown),
          ]).check(
            Schema.makeFilter((input) =>
              Object.entries(input).every(
                ([key, value]) =>
                  ['name'].includes(key) ||
                  Schema.is(Schema.toEncoded(Schema.Number.check(Schema.isInt())))(value),
              ),
            ),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
