import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import * as z from 'zod'
import { TagSchema, PetSchema, NewPetSchema } from '../components'

export const getPetsHandler = defineHandler({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).exactOptional(),
    tag: TagSchema.exactOptional(),
  }),
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
  cookie: z.object({ session: z.string().exactOptional() }),
  response: z.array(PetSchema),
})(async (c, { query, header, cookie }) => {})

export const postPetsHandler = defineHandler({
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
  json: NewPetSchema,
  response: PetSchema,
})(async (c, { header, json }) => {})

export const headPetsHandler = defineHandler({
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
})(async (c, { header }) => {})

export const getPetsPetIdHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int().min(1) }),
  response: PetSchema,
})(async (c, { param }) => {})

export const deletePetsPetIdHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int() }),
})(async (c, { param }) => {})

export const postPetsPetIdPhotosHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int() }),
  form: z.object({ caption: z.string().min(1), featured: z.stringbool().exactOptional() }),
})(async (c, { param, form }) => {})

export const petsHandler = new Hono()
  .get('/pets', getPetsHandler)
  .post('/pets', postPetsHandler)
  .on('HEAD', '/pets', headPetsHandler)
  .get('/pets/:petId', getPetsPetIdHandler)
  .delete('/pets/:petId', deletePetsPetIdHandler)
  .post('/pets/:petId/photos', postPetsPetIdPhotosHandler)
