import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import * as z from 'zod'
import { TagSchema, PetSchema, NewPetSchema } from '../components'
import { createMiddleware } from 'hono/factory'
import type { Pet } from '../components'

const LIMIT = 10

const pets: Pet[] = []

const countRequests = createMiddleware(async (c, next) => {
  await next()
  c.res.headers.set('X-Requests-Seen', String(pets.length))
})

/** Lists the pets kept in memory, up to LIMIT. */
export const getPetsHandler = defineHandler({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).exactOptional(),
    tag: TagSchema.exactOptional(),
  }),
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
  cookie: z.object({ session: z.string().exactOptional() }),
  response: z.array(PetSchema),
})(countRequests, async (c, { query }) => pets.slice(0, query.limit ?? LIMIT))

export const postPetsHandler = defineHandler({
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
  json: NewPetSchema,
  response: PetSchema,
})(async (c, { json }) => {
  const pet = { id: pets.length + 1, ...json }
  pets.push(pet)
  c.status(201)
  return pet
})

export const headPetsHandler = defineHandler({
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
})(async (c) => c.body(null, 200))

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
