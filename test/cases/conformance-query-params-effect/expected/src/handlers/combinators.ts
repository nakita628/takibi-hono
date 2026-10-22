import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const combinatorsHandler = new Hono().get(
  '/combinators',
  describeRoute({ operationId: 'queryCombinators', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        allof: Schema.optional(
          Schema.NumberFromString.check(Schema.isInt()).check(
            Schema.makeFilter((input) => Schema.is(Schema.Unknown)(input)),
          ),
        ),
        allof_range: Schema.optional(
          Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)).check(
            Schema.makeFilter((input) =>
              Schema.is(
                Schema.NumberFromString.check(Schema.isInt(), Schema.isLessThanOrEqualTo(10)),
              )(input),
            ),
          ),
        ),
        oneof_is: Schema.optional(
          Schema.Union([Schema.NumberFromString.check(Schema.isInt()), Schema.String]),
        ),
        oneof_ib: Schema.optional(
          Schema.Union([
            Schema.NumberFromString.check(Schema.isInt()),
            Schema.Literals(['true', 'false']).pipe(
              Schema.decodeTo(
                Schema.Boolean,
                SchemaTransformation.transform({
                  decode: (input) => input === 'true',
                  encode: (input) => (input ? 'true' : 'false'),
                }),
              ),
            ),
          ]),
        ),
        anyof_ns: Schema.optional(Schema.Union([Schema.NumberFromString, Schema.String])),
        mixed: Schema.optional(Schema.Literals([1, 'a', '2'])),
        not_zero: Schema.optional(Schema.Unknown.check(Schema.makeFilter((input) => input !== 0))),
        not_enum: Schema.optional(
          Schema.Unknown.check(
            Schema.makeFilter((input) => ![1, 2].some((item) => item === input)),
          ),
        ),
        not_string: Schema.optional(
          Schema.Unknown.check(Schema.makeFilter((input) => typeof input !== 'string')),
        ),
        typeless_min: Schema.optional(Schema.Unknown),
        typeless_len: Schema.optional(Schema.Unknown),
        nconst: Schema.optional(Schema.Literal(2)),
        multi: Schema.optional(Schema.String),
        multi_nb: Schema.optional(Schema.NumberFromString),
        tuple: Schema.optional(
          Schema.Tuple([Schema.NumberFromString.check(Schema.isInt()), Schema.String]),
        ),
      }),
    ),
  ),
  (c) => {},
)
