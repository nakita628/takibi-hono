import { defineHandler } from 'hono/factory'
import * as z from 'zod'
import { PetSchema, NewPetSchema } from '@/components'

export const postPetsHandler = defineHandler({
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
  json: NewPetSchema,
  response: PetSchema,
})
