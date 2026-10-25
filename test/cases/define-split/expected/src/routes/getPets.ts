import { defineHandler } from 'hono/factory'
import * as z from 'zod'
import { TagSchema, PetSchema } from '@/components'

export const getPetsHandler = defineHandler({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).exactOptional(),
    tag: TagSchema.exactOptional(),
  }),
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
  cookie: z.object({ session: z.string().exactOptional() }),
  response: z.array(PetSchema),
})
