import { resolver } from 'hono-openapi'
import * as z from 'zod'

export const CountSchema = z.int().min(0).meta({ ref: 'Count' })

export type Count = z.infer<typeof CountSchema>

export const FlagSchema = z.boolean().meta({ ref: 'Flag' })

export type Flag = z.infer<typeof FlagSchema>

export const ItemSchema = z
  .object({ name: z.string(), price: z.int().min(0), stocked: z.boolean().exactOptional() })
  .meta({ ref: 'Item' })

export type Item = z.infer<typeof ItemSchema>

export const FieldsResponse = {
  description: 'Every validated field, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(z.any()) } },
}
