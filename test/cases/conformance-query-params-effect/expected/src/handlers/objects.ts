import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const objectsHandler = new Hono().get(
  '/objects',
  describeRoute({ operationId: 'queryObjects', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        deep: Schema.optionalKey(
          Schema.Struct({
            name: Schema.optionalKey(Schema.String),
            age: Schema.optionalKey(
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
            active: Schema.optionalKey(
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
            ids: Schema.optionalKey(
              Schema.Unknown.pipe(
                Schema.decodeTo(
                  Schema.Unknown,
                  SchemaTransformation.transform<unknown, unknown>({
                    decode: (input) =>
                      input === undefined || Array.isArray(input) ? input : [input],
                    encode: (output) => output,
                  }),
                ),
                Schema.decodeTo(
                  Schema.Array(
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
            points: Schema.optionalKey(
              Schema.Unknown.pipe(
                Schema.decodeTo(
                  Schema.Unknown,
                  SchemaTransformation.transform<unknown, unknown>({
                    decode: (input) =>
                      input === undefined || Array.isArray(input) ? input : [input],
                    encode: (output) => output,
                  }),
                ),
                Schema.decodeTo(
                  Schema.Array(
                    Schema.Struct({
                      x: Schema.optionalKey(
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
                      y: Schema.optionalKey(
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
            tags: Schema.optionalKey(
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
            range: Schema.optionalKey(
              Schema.Struct({
                min: Schema.optionalKey(
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
                max: Schema.optionalKey(
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
          }),
        ),
        deep_ref: Schema.optionalKey(
          Schema.Struct({
            from: Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
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
            to: Schema.optionalKey(
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
        spread: Schema.optionalKey(
          Schema.Struct({
            sort: Schema.optionalKey(Schema.Literals(['asc', 'desc'])),
            size: Schema.optionalKey(
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
            page: Schema.optionalKey(
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
        pairs: Schema.optionalKey(
          Schema.Struct({
            name: Schema.optionalKey(Schema.String),
            age: Schema.optionalKey(
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
        page: Schema.optionalKey(Schema.String),
        limit: Schema.optionalKey(
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
  (c) => {},
)
