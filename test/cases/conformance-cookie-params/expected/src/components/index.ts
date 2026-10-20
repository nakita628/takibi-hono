import { resolver } from 'hono-openapi'
import * as z from 'zod'

export const CountSchema = z.int().min(0).meta({ ref: 'Count' })

export type Count = z.infer<typeof CountSchema>

export const FieldsResponse = {
  description:
    'Every validated parameter, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(z.any()) } },
}
