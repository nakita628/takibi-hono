import { defineHandler } from 'hono/factory'
import * as z from 'zod'

export const postPetsPetIdPhotosHandler = defineHandler({
  param: z.object({
    petId: z.preprocess(
      (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
      z.number().int(),
    ),
  }),
  form: z.object({ caption: z.string().min(1), featured: z.stringbool().exactOptional() }),
})
