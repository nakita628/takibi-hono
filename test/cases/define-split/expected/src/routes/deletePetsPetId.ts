import { defineHandler } from 'hono/factory'
import * as z from 'zod'

export const deletePetsPetIdHandler = defineHandler({
  param: z.object({ petId: z.coerce.number().int() }),
})
