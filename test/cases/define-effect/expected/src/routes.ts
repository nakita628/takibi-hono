import { defineHandler } from 'hono/factory'
import { Schema, SchemaTransformation } from 'effect'
import { TagSchema, PetSchema, NewPetSchema } from './components'

export const getHandler = defineHandler({
  response: Schema.toStandardSchemaV1(Schema.Struct({ status: Schema.Literal('ok') })),
})

export const getPetsHandler = defineHandler({
  query: Schema.toStandardSchemaV1(
    Schema.Struct({
      limit: Schema.optional(
        Schema.FiniteFromString.check(
          Schema.isInt(),
          Schema.isGreaterThanOrEqualTo(1),
          Schema.isLessThanOrEqualTo(100),
        ),
      ),
      tag: Schema.optional(TagSchema),
    }),
  ),
  header: Schema.toStandardSchemaV1(
    Schema.Struct({ 'x-request-id': Schema.optional(Schema.String) }),
  ),
  cookie: Schema.toStandardSchemaV1(Schema.Struct({ session: Schema.optional(Schema.String) })),
  response: Schema.toStandardSchemaV1(Schema.Array(PetSchema)),
})

export const postPetsHandler = defineHandler({
  header: Schema.toStandardSchemaV1(
    Schema.Struct({ 'x-request-id': Schema.optional(Schema.String) }),
  ),
  json: Schema.toStandardSchemaV1(NewPetSchema),
  response: Schema.toStandardSchemaV1(PetSchema),
})

export const headPetsHandler = defineHandler({
  header: Schema.toStandardSchemaV1(
    Schema.Struct({ 'x-request-id': Schema.optional(Schema.String) }),
  ),
})

export const getPetsPetIdHandler = defineHandler({
  param: Schema.toStandardSchemaV1(
    Schema.Struct({
      petId: Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
    }),
  ),
  response: Schema.toStandardSchemaV1(PetSchema),
})

export const deletePetsPetIdHandler = defineHandler({
  param: Schema.toStandardSchemaV1(
    Schema.Struct({ petId: Schema.FiniteFromString.check(Schema.isInt()) }),
  ),
})

export const postPetsPetIdPhotosHandler = defineHandler({
  param: Schema.toStandardSchemaV1(
    Schema.Struct({ petId: Schema.FiniteFromString.check(Schema.isInt()) }),
  ),
  form: Schema.toStandardSchemaV1(
    Schema.Struct({
      caption: Schema.String.check(
        Schema.makeFilter((input) => [...input].length >= 1, {
          expected: 'a string of at least 1 character',
        }),
      ),
      featured: Schema.optional(
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
})

export const get202401ReportsHandler = defineHandler({
  response: Schema.toStandardSchemaV1(Schema.Array(Schema.String)),
})
