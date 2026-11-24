import { defineHandler } from 'hono/factory'
import * as z from 'zod'
import { PetSchema } from '@/components'

export const getPetsPetIdHandler = defineHandler({
  param: z.object({
    petId: z.preprocess(
      (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
      z.number().int().min(1),
    ),
  }),
  response: PetSchema,
})
