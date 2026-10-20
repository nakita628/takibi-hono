import { resolver } from 'hono-openapi'
import * as z from 'zod'

export const IdSchema = z.int64().min(0n).meta({ ref: 'Id' })

export type Id = z.infer<typeof IdSchema>

export const FieldsResponse = {
  description: 'Every validated field, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(z.any()) } },
}
