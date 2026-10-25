import { Hono } from 'hono'
import { createMiddleware, defineHandler } from 'hono/factory'
import * as z from 'zod'
import type { Pet } from '../components'
import { NewPetSchema, PetSchema } from '../components'

const LIMIT = 10

const pets: Pet[] = []

const countRequests = createMiddleware(async (c, next) => {
  await next()
  c.res.headers.set('X-Requests-Seen', String(pets.length))
})

/** Lists the pets kept in memory, up to LIMIT. */
export const getPetsHandler = defineHandler({
  query: z.object({ limit: z.coerce.number().int().optional() }),
})(countRequests, async (c, { query }) => pets.slice(0, query.limit ?? LIMIT))

export const postPetsHandler = defineHandler({ json: NewPetSchema, response: PetSchema })(
  async (c, { json }) => {
    const pet = { id: pets.length + 1, ...json }
    pets.push(pet)
    c.status(201)
    return pet
  },
)

export const headPetsHandler = defineHandler(async (c) => c.body(null, 200))

export const petsHandler = new Hono()
  .get('/pets', getPetsHandler)
  .post('/pets', postPetsHandler)
  .on('HEAD', '/pets', headPetsHandler)
