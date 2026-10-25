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
        ienum: Schema.optional(
          Schema.FiniteFromString.pipe(Schema.decodeTo(Schema.Literals([1, 2, 3]))),
        ),
        nenum: Schema.optional(
          Schema.FiniteFromString.pipe(Schema.decodeTo(Schema.Literals([1.5, 2.5]))),
        ),
        benum: Schema.optional(
          Schema.String.check(
            Schema.isPattern(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
          )
            .pipe(
              Schema.decodeTo(
                Schema.Boolean,
                SchemaTransformation.transform({
                  decode: (input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input),
                  encode: (output) => (output ? 'true' : 'false'),
                }),
              ),
            )
            .pipe(Schema.decodeTo(Schema.Literal(true))),
        ),
        iconst: Schema.optional(Schema.FiniteFromString.pipe(Schema.decodeTo(Schema.Literal(7)))),
        senum: Schema.optional(Schema.Literals(['asc', 'desc'])),
        sconst: Schema.optional(Schema.Literal('fixed')),
        numericsenum: Schema.optional(Schema.Literals(['1', '02', 'true'])),
        inull: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === 'null' ? null : input),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(Schema.NullOr(Schema.FiniteFromString.check(Schema.isInt()))),
          ),
        ),
        bnull: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === 'null' ? null : input),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(
              Schema.NullOr(
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
              ),
            ),
          ),
        ),
        nullof: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === 'null' ? null : input),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(
              Schema.NullOr(
                Schema.Union([
                  Schema.FiniteFromString.check(Schema.isInt()),
                  Schema.Unknown.pipe(
                    Schema.decodeTo(
                      Schema.Unknown,
                      SchemaTransformation.transform<unknown, unknown>({
                        decode: (input) => (input === 'null' ? null : input),
                        encode: (output) => output,
                      }),
                    ),
                    Schema.decodeTo(Schema.NullOr(Schema.Null)),
                  ),
                ]),
              ),
            ),
          ),
        ),
        inull_arr: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(
              Schema.Array(
                Schema.Unknown.pipe(
                  Schema.decodeTo(
                    Schema.Unknown,
                    SchemaTransformation.transform<unknown, unknown>({
                      decode: (input) => (input === 'null' ? null : input),
                      encode: (output) => output,
                    }),
                  ),
                  Schema.decodeTo(Schema.NullOr(Schema.FiniteFromString.check(Schema.isInt()))),
                ),
              ),
            ),
          ),
        ),
        inull_list: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === 'null' ? null : input),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(
              Schema.NullOr(
                Schema.Unknown.pipe(
                  Schema.decodeTo(
                    Schema.Unknown,
                    SchemaTransformation.transform<unknown, unknown>({
                      decode: (input) =>
                        input === undefined || Array.isArray(input) ? input : [input],
                      encode: (output) => output,
                    }),
                  ),
                  Schema.decodeTo(Schema.Array(Schema.FiniteFromString.check(Schema.isInt()))),
                ),
              ),
            ),
          ),
        ),
        snull: Schema.optional(Schema.NullOr(Schema.String)),
        ioneof: Schema.optional(
          Schema.Union([Schema.FiniteFromString.check(Schema.isInt()), Schema.Literal('all')]),
        ),
        ienum_arr: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(
              Schema.Array(
                Schema.FiniteFromString.pipe(Schema.decodeTo(Schema.Literals([1, 2, 3]))),
              ),
            ),
          ),
        ),
        senum_arr: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(Schema.Array(Schema.Literals(['asc', 'desc']))),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
