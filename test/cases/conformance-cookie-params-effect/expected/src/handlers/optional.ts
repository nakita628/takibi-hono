import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { CountSchema, FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'cookieOptional', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        int_opt: Schema.optional(Schema.Number.check(Schema.isInt())),
        int64_opt: Schema.optional(Schema.Number.check(Schema.isInt())),
        bool_opt: Schema.optional(Schema.Boolean),
        str_opt: Schema.optional(Schema.String),
        ienum: Schema.optional(Schema.Literals([1, 2, 3])),
        benum: Schema.optional(Schema.Literal(true)),
        iconst: Schema.optional(Schema.Literal(7)),
        senum: Schema.optional(Schema.Literals(['asc', 'desc'])),
        ioneof: Schema.optional(
          Schema.Union([Schema.Number.check(Schema.isInt()), Schema.Literal('all')]),
        ),
        range: Schema.optional(
          Schema.Number.check(
            Schema.isInt(),
            Schema.isGreaterThanOrEqualTo(1),
            Schema.isLessThanOrEqualTo(100),
          ),
        ),
        length: Schema.optional(Schema.String.check(Schema.isMinLength(2), Schema.isMaxLength(4))),
        pattern: Schema.optional(Schema.String.check(Schema.isPattern(/^[a-z]+-\d{1,3}$/))),
        ref_int: Schema.optional(CountSchema),
        prefs: Schema.optional(
          Schema.Struct({
            theme: Schema.optional(Schema.String),
            size: Schema.optional(Schema.Number.check(Schema.isInt())),
          }),
        ),
        obj: Schema.optional(
          Schema.Struct({
            a: Schema.optional(Schema.Number.check(Schema.isInt())),
            b: Schema.optional(Schema.String),
          }),
        ),
        tx_lower: Schema.optional(
          Schema.String.pipe(Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase())),
        ),
        tx_email: Schema.optional(
          Schema.String.pipe(
            Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase()),
          ).check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
        ),
        'session-id': Schema.optional(Schema.Number.check(Schema.isInt())),
        'user.id': Schema.optional(Schema.Number.check(Schema.isInt())),
        Int_Opt: Schema.optional(Schema.String),
        inull: Schema.optional(Schema.NullOr(Schema.Number.check(Schema.isInt()))),
        constructor: Schema.optional(Schema.Number.check(Schema.isInt())),
      }),
    ),
  ),
  (c) => {},
)
