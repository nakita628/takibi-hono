import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import { Schema, SchemaTransformation } from 'effect'
import { TagSchema, NewPetSchema } from '../components'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator(
      'query',
      Schema.toStandardSchemaV1(
        Schema.Struct({
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
              .check(
                Schema.isInt(),
                Schema.isGreaterThanOrEqualTo(1),
                Schema.isLessThanOrEqualTo(100),
              ),
          ),
          tag: Schema.optionalKey(TagSchema),
        }),
      ),
    ),
    sValidator(
      'header',
      Schema.toStandardSchemaV1(
        Schema.Struct({ 'x-request-id': Schema.optionalKey(Schema.String) }),
      ),
    ),
    sValidator(
      'cookie',
      Schema.toStandardSchemaV1(Schema.Struct({ session: Schema.optionalKey(Schema.String) })),
    ),
    (c) => {},
  )
  .post(
    '/pets',
    sValidator(
      'header',
      Schema.toStandardSchemaV1(
        Schema.Struct({ 'x-request-id': Schema.optionalKey(Schema.String) }),
      ),
    ),
    sValidator('json', Schema.toStandardSchemaV1(NewPetSchema)),
    (c) => {},
  )
  .on(
    'HEAD',
    '/pets',
    sValidator(
      'header',
      Schema.toStandardSchemaV1(
        Schema.Struct({ 'x-request-id': Schema.optionalKey(Schema.String) }),
      ),
    ),
    (c) => {},
  )
  .get(
    '/pets/:petId',
    sValidator(
      'param',
      Schema.toStandardSchemaV1(
        Schema.Struct({
          petId: Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
            .pipe(
              Schema.decodeTo(
                Schema.Finite,
                SchemaTransformation.transform({
                  decode: (input) => Number(input),
                  encode: (output) => String(output),
                }),
              ),
            )
            .check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
        }),
      ),
    ),
    (c) => {},
  )
  .delete(
    '/pets/:petId',
    sValidator(
      'param',
      Schema.toStandardSchemaV1(
        Schema.Struct({
          petId: Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
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
        }),
      ),
    ),
    (c) => {},
  )
  .post(
    '/pets/:petId/photos',
    sValidator(
      'param',
      Schema.toStandardSchemaV1(
        Schema.Struct({
          petId: Schema.String.check(Schema.isPattern(/^-?(?:0|[1-9]\d*)$/))
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
        }),
      ),
    ),
    sValidator(
      'form',
      Schema.toStandardSchemaV1(
        Schema.Struct({
          caption: Schema.String.check(
            Schema.makeFilter((input) => [...input].length >= 1, {
              expected: 'a string of at least 1 character',
            }),
          ),
          featured: Schema.optionalKey(
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
        }),
      ),
    ),
    (c) => {},
  )
