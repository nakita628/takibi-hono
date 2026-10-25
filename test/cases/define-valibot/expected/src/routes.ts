import { defineHandler } from 'hono/factory'
import * as v from 'valibot'
import { TagSchema, PetSchema, NewPetSchema } from './components'

export const getHandler = defineHandler({ response: v.object({ status: v.literal('ok') }) })

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
})

export const postPetsHandler = defineHandler({
  header: v.partial(v.object({ 'x-request-id': v.string() })),
  json: NewPetSchema,
  response: PetSchema,
})

export const headPetsHandler = defineHandler({
  header: v.partial(v.object({ 'x-request-id': v.string() })),
})

export const getPetsPetIdHandler = defineHandler({
  param: v.object({
    petId: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger(), v.minValue(1)),
  }),
  response: PetSchema,
})

export const deletePetsPetIdHandler = defineHandler({
  param: v.object({ petId: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()) }),
})

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
})

export const get202401ReportsHandler = defineHandler({ response: v.array(v.string()) })
