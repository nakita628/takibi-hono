import { defineHandler } from 'hono/factory'
import * as z from 'zod'

export const deletePetsPetIdHandler = defineHandler({
  param: z.object({
    petId: z
      .string()
      .regex(/^-?(?:0|[1-9]\d*)$/)
      .transform((val) => Number(val))
      .pipe(z.number().int()),
  }),
})
