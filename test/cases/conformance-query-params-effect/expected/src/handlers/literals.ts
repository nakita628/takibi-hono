import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const literalsHandler = new Hono().get(
  '/literals',
  describeRoute({ operationId: 'queryLiterals', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        ienum: Schema.optional(Schema.Literals([1, 2, 3])),
        nenum: Schema.optional(Schema.Literals([1.5, 2.5])),
        benum: Schema.optional(Schema.Literal(true)),
        iconst: Schema.optional(Schema.Literal(7)),
        senum: Schema.optional(Schema.Literals(['asc', 'desc'])),
        sconst: Schema.optional(Schema.Literal('fixed')),
        numericsenum: Schema.optional(Schema.Literals(['1', '02', 'true'])),
        inull: Schema.optional(Schema.NullOr(Schema.NumberFromString.check(Schema.isInt()))),
        bnull: Schema.optional(
          Schema.NullOr(
            Schema.Literals(['true', 'false']).pipe(
              Schema.decodeTo(
                Schema.Boolean,
                SchemaTransformation.transform({
                  decode: (input) => input === 'true',
                  encode: (input) => (input ? 'true' : 'false'),
                }),
              ),
            ),
          ),
        ),
        nullof: Schema.optional(
          Schema.Union([Schema.NumberFromString.check(Schema.isInt()), Schema.NullOr(Schema.Null)]),
        ),
        inull_arr: Schema.optional(
          Schema.Array(Schema.NullOr(Schema.NumberFromString.check(Schema.isInt()))),
        ),
        inull_list: Schema.optional(
          Schema.NullOr(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        ),
        snull: Schema.optional(Schema.NullOr(Schema.String)),
        ioneof: Schema.optional(
          Schema.Union([Schema.NumberFromString.check(Schema.isInt()), Schema.Literal('all')]),
        ),
        ienum_arr: Schema.optional(Schema.Array(Schema.Literals([1, 2, 3]))),
        senum_arr: Schema.optional(Schema.Array(Schema.Literals(['asc', 'desc']))),
      }),
    ),
  ),
  (c) => {},
)
