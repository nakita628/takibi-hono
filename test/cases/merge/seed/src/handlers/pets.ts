import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { cache } from 'hono/cache'
import * as z from 'zod'
import type { Pet } from '../components'
import { PetSchema } from '../components'

const LIMIT = 10

const pets: Pet[] = []

export const petsHandler = new Hono()
  /** Lists the pets kept in memory, up to LIMIT. */
  .get(
    '/pets',
    describeRoute({ responses: { '200': { description: 'stale metadata' } } }),
    validator('query', z.object({ limit: z.coerce.number().int().optional() })),
    (c) => {
      const { limit = LIMIT } = c.req.valid('query')
      return c.json(pets.slice(0, limit), 200)
    },
  )
  .post('/pets', validator('json', PetSchema), (c) => {
    pets.push({ id: pets.length + 1, ...c.req.valid('json') })
    return c.json(pets.at(-1), 201)
  })
  .on('HEAD', '/pets', (c) => c.body(null, 200))
  .get('/pets/:petId', (c) => c.json({ gone: 'this route moved to another file' }))
