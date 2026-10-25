import { defineHandler } from 'hono/factory'
import * as z from 'zod'

export const headPetsHandler = defineHandler({
  header: z.object({ 'x-request-id': z.string().exactOptional() }),
})
