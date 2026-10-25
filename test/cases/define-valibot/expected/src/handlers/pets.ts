import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import * as v from 'valibot'
import { TagSchema, PetSchema, NewPetSchema } from '../components'

export const getPetsHandler = defineHandler({
  query: v.partial(
    v.object({
      limit: v.pipe(
        v.string(),
        v.transform(Number),
        v.number(),
        v.safeInteger(),
        v.minValue(1),
        v.maxValue(100),
      ),
      tag: TagSchema,
    }),
  ),
  header: v.partial(v.object({ 'x-request-id': v.string() })),
  cookie: v.partial(v.object({ session: v.string() })),
  response: v.array(PetSchema),
})(async (c, { query, header, cookie }) => {})

export const postPetsHandler = defineHandler({
  header: v.partial(v.object({ 'x-request-id': v.string() })),
  json: NewPetSchema,
  response: PetSchema,
})(async (c, { header, json }) => {})

export const headPetsHandler = defineHandler({
  header: v.partial(v.object({ 'x-request-id': v.string() })),
})(async (c, { header }) => {})

export const getPetsPetIdHandler = defineHandler({
  param: v.object({
    petId: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger(), v.minValue(1)),
  }),
  response: PetSchema,
})(async (c, { param }) => {})

export const deletePetsPetIdHandler = defineHandler({
  param: v.object({ petId: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()) }),
})(async (c, { param }) => {})

export const postPetsPetIdPhotosHandler = defineHandler({
  param: v.object({ petId: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()) }),
  form: v.object({
    caption: v.pipe(v.string(), v.minCodePoints(1)),
    featured: v.optional(
      v.pipe(
        v.string(),
        v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
        v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
      ),
    ),
  }),
})(async (c, { param, form }) => {})

export const petsHandler = new Hono()
  .get('/pets', getPetsHandler)
  .post('/pets', postPetsHandler)
  .on('HEAD', '/pets', headPetsHandler)
  .get('/pets/:petId', getPetsPetIdHandler)
  .delete('/pets/:petId', deletePetsPetIdHandler)
  .post('/pets/:petId/photos', postPetsPetIdPhotosHandler)
