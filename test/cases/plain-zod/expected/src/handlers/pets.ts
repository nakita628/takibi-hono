import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as z from 'zod'
import { TagSchema, NewPetSchema } from '../components'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator(
      'query',
      z.object({
        limit: z.coerce.number().int().min(1).max(100).exactOptional(),
        tag: TagSchema.exactOptional(),
      }),
    ),
    sValidator('header', z.object({ 'X-Request-Id': z.string().exactOptional() })),
    sValidator('cookie', z.object({ session: z.string().exactOptional() })),
    (c) => {},
  )
  .post(
    '/pets',
    sValidator('header', z.object({ 'X-Request-Id': z.string().exactOptional() })),
    sValidator('json', NewPetSchema),
    (c) => {},
  )
  .on(
    'HEAD',
    '/pets',
    sValidator('header', z.object({ 'X-Request-Id': z.string().exactOptional() })),
    (c) => {},
  )
  .get(
    '/pets/:petId',
    sValidator('param', z.object({ petId: z.coerce.number().int().min(1) })),
    (c) => {},
  )
  .delete(
    '/pets/:petId',
    sValidator('param', z.object({ petId: z.coerce.number().int() })),
    (c) => {},
  )
  .post(
    '/pets/:petId/photos',
    sValidator('param', z.object({ petId: z.coerce.number().int() })),
    sValidator(
      'form',
      z.object({ caption: z.string().min(1), featured: z.stringbool().exactOptional() }),
    ),
    (c) => {},
  )
