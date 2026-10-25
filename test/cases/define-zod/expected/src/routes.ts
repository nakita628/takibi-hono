import { defineHandler } from 'hono/factory'
import * as z from 'zod'
import { TagSchema, PetSchema, NewPetSchema } from './components'

export const getHandler = defineHandler({ response: z.object({ status: z.literal('ok') }) })

export const getPetsHandler = defineHandler({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).exactOptional(),
    tag: TagSchema.exactOptional(),
  }),
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
  cookie: z.object({ session: z.string().exactOptional() }),
  response: z.array(PetSchema),
})

export const postPetsHandler = defineHandler({
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
  json: NewPetSchema,
  response: PetSchema,
})

export const headPetsHandler = defineHandler({
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
})

export const getPetsPetIdHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int().min(1) }),
  response: PetSchema,
})

export const deletePetsPetIdHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int() }),
})

export const postPetsPetIdPhotosHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int() }),
  form: z.object({ caption: z.string().min(1), featured: z.stringbool().exactOptional() }),
})

export const get202401ReportsHandler = defineHandler({ response: z.array(z.string()) })
