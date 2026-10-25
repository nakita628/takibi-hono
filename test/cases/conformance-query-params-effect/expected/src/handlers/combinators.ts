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
          Schema.FiniteFromString.check(Schema.isInt()).check(
            Schema.makeFilter((input) =>
              Schema.is(Schema.FiniteFromString.check(Schema.isGreaterThanOrEqualTo(5)))(input),
            ),
          ),
        ),
        allof_range: Schema.optional(
          Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)).check(
            Schema.makeFilter((input) =>
              Schema.is(
                Schema.FiniteFromString.check(Schema.isInt(), Schema.isLessThanOrEqualTo(10)),
              )(input),
            ),
          ),
        ),
        oneof_is: Schema.optional(
          Schema.Union([Schema.FiniteFromString.check(Schema.isInt()), Schema.String]),
        ),
        oneof_ib: Schema.optional(
          Schema.Union([
            Schema.FiniteFromString.check(Schema.isInt()),
            Schema.String.check(
              Schema.isPattern(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            ).pipe(
              Schema.decodeTo(
                Schema.Boolean,
                SchemaTransformation.transform({
                  decode: (input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input),
                  encode: (output) => (output ? 'true' : 'false'),
                }),
              ),
            ),
          ]),
        ),
        anyof_ns: Schema.optional(Schema.Union([Schema.FiniteFromString, Schema.String])),
        mixed: Schema.optional(Schema.Literals([1, 'a', '2'])),
        not_zero: Schema.optional(
          Schema.FiniteFromString.check(Schema.isInt()).check(
            Schema.makeFilter((input) => input !== 0),
          ),
        ),
        not_enum: Schema.optional(
          Schema.Unknown.check(
            Schema.makeFilter((input) => ![1, 2].some((item) => item === input)),
          ),
        ),
        not_string: Schema.optional(
          Schema.Unknown.check(Schema.makeFilter((input) => typeof input !== 'string')),
        ),
        typeless_min: Schema.optional(
          Schema.FiniteFromString.check(Schema.isGreaterThanOrEqualTo(1)),
        ),
        typeless_len: Schema.optional(
          Schema.String.check(
            Schema.makeFilter((input) => [...input].length >= 3, {
              expected: 'a string of at least 3 characters',
            }),
          ),
        ),
        nconst: Schema.optional(Schema.FiniteFromString.pipe(Schema.decodeTo(Schema.Literal(2)))),
        multi: Schema.optional(
          Schema.Union([Schema.FiniteFromString.check(Schema.isInt()), Schema.String]),
        ),
        multi_nb: Schema.optional(
          Schema.Union([
            Schema.FiniteFromString,
            Schema.String.check(
              Schema.isPattern(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            ).pipe(
              Schema.decodeTo(
                Schema.Boolean,
                SchemaTransformation.transform({
                  decode: (input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input),
                  encode: (output) => (output ? 'true' : 'false'),
                }),
              ),
            ),
          ]),
        ),
        tuple: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(
              Schema.Tuple([Schema.FiniteFromString.check(Schema.isInt()), Schema.String]),
            ),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
