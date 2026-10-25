import { defineHandler } from 'hono/factory'
import * as z from 'zod'

export const postPetsPetIdPhotosHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int() }),
  form: z.object({ caption: z.string().min(1), featured: z.stringbool().exactOptional() }),
})
