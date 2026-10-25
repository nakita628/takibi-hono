import { defineHandler } from 'hono/factory'
import * as z from 'zod'
import { PetSchema } from '@/components'

export const getPetsPetIdHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int().min(1) }),
  response: PetSchema,
})
