import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import { Schema } from 'effect'
import { TagSchema, NewPetSchema } from '../components'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator(
      'query',
      Schema.toStandardSchemaV1(
        Schema.Struct({
          limit: Schema.optional(
            Schema.NumberFromString.check(
              Schema.isInt(),
              Schema.isGreaterThanOrEqualTo(1),
              Schema.isLessThanOrEqualTo(100),
            ),
          ),
          tag: Schema.optional(TagSchema),
        }),
      ),
    ),
    sValidator(
      'header',
      Schema.toStandardSchemaV1(Schema.Struct({ 'X-Request-Id': Schema.optional(Schema.String) })),
    ),
    sValidator(
      'cookie',
      Schema.toStandardSchemaV1(Schema.Struct({ session: Schema.optional(Schema.String) })),
    ),
    (c) => {},
  )
  .post(
    '/pets',
    sValidator(
      'header',
      Schema.toStandardSchemaV1(Schema.Struct({ 'X-Request-Id': Schema.optional(Schema.String) })),
    ),
    sValidator('json', Schema.toStandardSchemaV1(NewPetSchema)),
    (c) => {},
  )
  .on(
    'HEAD',
    '/pets',
    sValidator(
      'header',
      Schema.toStandardSchemaV1(Schema.Struct({ 'X-Request-Id': Schema.optional(Schema.String) })),
    ),
    (c) => {},
  )
  .get(
    '/pets/:petId',
    sValidator(
      'param',
      Schema.toStandardSchemaV1(
        Schema.Struct({
          petId: Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
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
        Schema.Struct({ petId: Schema.NumberFromString.check(Schema.isInt()) }),
      ),
    ),
    (c) => {},
  )
  .post(
    '/pets/:petId/photos',
    sValidator(
      'param',
      Schema.toStandardSchemaV1(
        Schema.Struct({ petId: Schema.NumberFromString.check(Schema.isInt()) }),
      ),
    ),
    sValidator(
      'form',
      Schema.toStandardSchemaV1(
        Schema.Struct({
          caption: Schema.String.check(Schema.isMinLength(1)),
          featured: Schema.optional(Schema.Boolean),
        }),
      ),
    ),
    (c) => {},
  )
