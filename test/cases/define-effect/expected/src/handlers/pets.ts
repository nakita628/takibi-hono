import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import { Schema, SchemaTransformation } from 'effect'
import { TagSchema, PetSchema, NewPetSchema } from '../components'

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
})(async (c, { query, header, cookie }) => {})

export const postPetsHandler = defineHandler({
  header: Schema.toStandardSchemaV1(
    Schema.Struct({ 'x-request-id': Schema.optional(Schema.String) }),
  ),
  json: Schema.toStandardSchemaV1(NewPetSchema),
  response: Schema.toStandardSchemaV1(PetSchema),
})(async (c, { header, json }) => {})

export const headPetsHandler = defineHandler({
  header: Schema.toStandardSchemaV1(
    Schema.Struct({ 'x-request-id': Schema.optional(Schema.String) }),
  ),
})(async (c, { header }) => {})

export const getPetsPetIdHandler = defineHandler({
  param: Schema.toStandardSchemaV1(
    Schema.Struct({
      petId: Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
    }),
  ),
  response: Schema.toStandardSchemaV1(PetSchema),
})(async (c, { param }) => {})

export const deletePetsPetIdHandler = defineHandler({
  param: Schema.toStandardSchemaV1(
    Schema.Struct({ petId: Schema.FiniteFromString.check(Schema.isInt()) }),
  ),
})(async (c, { param }) => {})

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
})(async (c, { param, form }) => {})

export const petsHandler = new Hono()
  .get('/pets', getPetsHandler)
  .post('/pets', postPetsHandler)
  .on('HEAD', '/pets', headPetsHandler)
  .get('/pets/:petId', getPetsPetIdHandler)
  .delete('/pets/:petId', deletePetsPetIdHandler)
  .post('/pets/:petId/photos', postPetsPetIdPhotosHandler)
