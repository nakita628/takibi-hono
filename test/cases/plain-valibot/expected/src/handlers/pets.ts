import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as v from 'valibot'
import { TagSchema, NewPetSchema } from '../components'

export const petsHandler = new Hono()
  .get(
    '/pets',
    sValidator(
      'query',
      v.partial(
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
    ),
    sValidator('header', v.partial(v.object({ 'X-Request-Id': v.string() }))),
    sValidator('cookie', v.partial(v.object({ session: v.string() }))),
    (c) => {},
  )
  .post(
    '/pets',
    sValidator('header', v.partial(v.object({ 'X-Request-Id': v.string() }))),
    sValidator('json', NewPetSchema),
    (c) => {},
  )
  .on(
    'HEAD',
    '/pets',
    sValidator('header', v.partial(v.object({ 'X-Request-Id': v.string() }))),
    (c) => {},
  )
  .get(
    '/pets/:petId',
    sValidator(
      'param',
      v.object({
        petId: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger(), v.minValue(1)),
      }),
    ),
    (c) => {},
  )
  .delete(
    '/pets/:petId',
    sValidator(
      'param',
      v.object({ petId: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()) }),
    ),
    (c) => {},
  )
  .post(
    '/pets/:petId/photos',
    sValidator(
      'param',
      v.object({ petId: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()) }),
    ),
    sValidator(
      'form',
      v.object({
        caption: v.pipe(v.string(), v.minCodePoints(1)),
        featured: v.optional(v.boolean()),
      }),
    ),
    (c) => {},
  )
