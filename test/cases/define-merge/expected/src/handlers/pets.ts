import { Hono } from 'hono'
import {
  getPetsHandler,
  postPetsHandler,
  headPetsHandler,
  getPetsPetIdHandler,
  deletePetsPetIdHandler,
  postPetsPetIdPhotosHandler,
} from '../routes'
import { createMiddleware } from 'hono/factory'
import type { Pet } from '../components'

const LIMIT = 10

const pets: Pet[] = []

const countRequests = createMiddleware(async (c, next) => {
  await next()
  c.res.headers.set('X-Requests-Seen', String(pets.length))
})

export const petsHandler = new Hono()
  /** Lists the pets kept in memory, up to LIMIT. */
  .get(
    '/pets',
    getPetsHandler(countRequests, async (c, { query }) => pets.slice(0, query.limit ?? LIMIT)),
  )
  .post(
    '/pets',
    postPetsHandler(async (c, { json }) => {
      const pet = { id: pets.length + 1, ...json }
      pets.push(pet)
      c.status(201)
      return pet
    }),
  )
  .on(
    'HEAD',
    '/pets',
    headPetsHandler(async (c) => c.body(null, 200)),
  )
  .get(
    '/pets/:petId',
    getPetsPetIdHandler(async (c, { param }) => {}),
  )
  .delete(
    '/pets/:petId',
    deletePetsPetIdHandler(async (c, { param }) => {}),
  )
  .post(
    '/pets/:petId/photos',
    postPetsPetIdPhotosHandler(async (c, { param, form }) => {}),
  )
