import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'headerOptional', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    Schema.toStandardSchemaV1(
      Schema.Unknown.pipe(
        Schema.decodeTo(
          Schema.Unknown,
          SchemaTransformation.transform<unknown, unknown>({
            decode: (input) =>
              typeof input === 'object' && input !== null && !Array.isArray(input)
                ? Object.assign(Object.create(null), input)
                : input,
            encode: (output) => output,
          }),
        ),
        Schema.decodeTo(
          Schema.Struct({
            'x-int-opt': Schema.optionalKey(
              Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                .pipe(
                  Schema.decodeTo(
                    Schema.Finite,
                    SchemaTransformation.transform({
                      decode: (input) => Number(input),
                      encode: (output) => String(output),
                    }),
                  ),
                )
                .check(Schema.isInt()),
            ),
            'x-int64-opt': Schema.optionalKey(
              Schema.BigIntFromString.check(
                Schema.isBetweenBigInt({
                  minimum: -9223372036854775808n,
                  maximum: 9223372036854775807n,
                }),
              ),
            ),
            'x-bool-opt': Schema.optionalKey(
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
            'x-str-opt': Schema.optionalKey(Schema.String),
            'x-ienum': Schema.optionalKey(
              Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                .pipe(
                  Schema.decodeTo(
                    Schema.Finite,
                    SchemaTransformation.transform({
                      decode: (input) => Number(input),
                      encode: (output) => String(output),
                    }),
                  ),
                )
                .pipe(Schema.decodeTo(Schema.Literals([1, 2, 3]))),
            ),
            'x-benum': Schema.optionalKey(
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
            'x-iconst': Schema.optionalKey(
              Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                .pipe(
                  Schema.decodeTo(
                    Schema.Finite,
                    SchemaTransformation.transform({
                      decode: (input) => Number(input),
                      encode: (output) => String(output),
                    }),
                  ),
                )
                .pipe(Schema.decodeTo(Schema.Literal(7))),
            ),
            'x-senum': Schema.optionalKey(Schema.Literals(['asc', 'desc'])),
            'x-ioneof': Schema.optionalKey(
              Schema.Union([
                Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                  .pipe(
                    Schema.decodeTo(
                      Schema.Finite,
                      SchemaTransformation.transform({
                        decode: (input) => Number(input),
                        encode: (output) => String(output),
                      }),
                    ),
                  )
                  .check(Schema.isInt()),
                Schema.Literal('all'),
              ]),
            ),
            'x-range': Schema.optionalKey(
              Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                .pipe(
                  Schema.decodeTo(
                    Schema.Finite,
                    SchemaTransformation.transform({
                      decode: (input) => Number(input),
                      encode: (output) => String(output),
                    }),
                  ),
                )
                .check(
                  Schema.isInt(),
                  Schema.isGreaterThanOrEqualTo(1),
                  Schema.isLessThanOrEqualTo(100),
                ),
            ),
            'x-length': Schema.optionalKey(
              Schema.String.check(
                Schema.makeFilter((input) => [...input].length >= 2, {
                  expected: 'a string of at least 2 characters',
                }),
                Schema.makeFilter((input) => [...input].length <= 4, {
                  expected: 'a string of at most 4 characters',
                }),
              ),
            ),
            'x-pattern': Schema.optionalKey(
              Schema.String.check(Schema.isPattern(/^[a-z]+-\d{1,3}$/)),
            ),
            'x-tx-lower': Schema.optionalKey(
              Schema.String.pipe(
                Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase()),
              ),
            ),
            'x-tx-email': Schema.optionalKey(
              Schema.String.pipe(
                Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase()),
              ).check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
            ),
            'x-ref-int': Schema.optionalKey(
              Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                .pipe(
                  Schema.decodeTo(
                    Schema.Finite,
                    SchemaTransformation.transform({
                      decode: (input) => Number(input),
                      encode: (output) => String(output),
                    }),
                  ),
                )
                .check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
            ),
            'x-str-arr': Schema.optionalKey(
              Schema.Unknown.pipe(
                Schema.decodeTo(
                  Schema.Unknown,
                  SchemaTransformation.transform<unknown, unknown>({
                    decode: (input) =>
                      input === undefined || Array.isArray(input) ? input : [input],
                    encode: (output) => output,
                  }),
                ),
                Schema.decodeTo(Schema.Array(Schema.String)),
              ),
            ),
            'x-obj': Schema.optionalKey(
              Schema.Struct({
                a: Schema.optionalKey(
                  Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                    .pipe(
                      Schema.decodeTo(
                        Schema.Finite,
                        SchemaTransformation.transform({
                          decode: (input) => Number(input),
                          encode: (output) => String(output),
                        }),
                      ),
                    )
                    .check(Schema.isInt()),
                ),
                b: Schema.optionalKey(Schema.String),
              }),
            ),
            'x-objx': Schema.optionalKey(
              Schema.Struct({
                a: Schema.optionalKey(
                  Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                    .pipe(
                      Schema.decodeTo(
                        Schema.Finite,
                        SchemaTransformation.transform({
                          decode: (input) => Number(input),
                          encode: (output) => String(output),
                        }),
                      ),
                    )
                    .check(Schema.isInt()),
                ),
                b: Schema.optionalKey(Schema.String),
              }),
            ),
            'x-request-id': Schema.optionalKey(Schema.String.check(Schema.isUUID())),
            'x-rate-limit': Schema.optionalKey(
              Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                .pipe(
                  Schema.decodeTo(
                    Schema.Finite,
                    SchemaTransformation.transform({
                      decode: (input) => Number(input),
                      encode: (output) => String(output),
                    }),
                  ),
                )
                .check(Schema.isInt()),
            ),
            'accept-version': Schema.optionalKey(
              Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                .pipe(
                  Schema.decodeTo(
                    Schema.Finite,
                    SchemaTransformation.transform({
                      decode: (input) => Number(input),
                      encode: (output) => String(output),
                    }),
                  ),
                )
                .check(Schema.isInt()),
            ),
            x_underscore: Schema.optionalKey(
              Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                .pipe(
                  Schema.decodeTo(
                    Schema.Finite,
                    SchemaTransformation.transform({
                      decode: (input) => Number(input),
                      encode: (output) => String(output),
                    }),
                  ),
                )
                .check(Schema.isInt()),
            ),
            'x-inull': Schema.optionalKey(
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
                    Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                      .pipe(
                        Schema.decodeTo(
                          Schema.Finite,
                          SchemaTransformation.transform({
                            decode: (input) => Number(input),
                            encode: (output) => String(output),
                          }),
                        ),
                      )
                      .check(Schema.isInt()),
                  ),
                ),
              ),
            ),
            constructor: Schema.optionalKey(
              Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
                .pipe(
                  Schema.decodeTo(
                    Schema.Finite,
                    SchemaTransformation.transform({
                      decode: (input) => Number(input),
                      encode: (output) => String(output),
                    }),
                  ),
                )
                .check(Schema.isInt()),
            ),
          }),
        ),
      ),
    ),
  ),
  (c) => {},
)
