import { resolver } from 'hono-openapi'
import * as v from 'valibot'

export const CountSchema = v.pipe(
  v.pipe(v.number(), v.integer(), v.minValue(0)),
  v.metadata({ ref: 'Count' }),
)

export type Count = v.InferOutput<typeof CountSchema>

export const FlagSchema = v.pipe(v.boolean(), v.metadata({ ref: 'Flag' }))

export type Flag = v.InferOutput<typeof FlagSchema>

export const ItemSchema = v.pipe(
  v.object({
    name: v.string(),
    price: v.pipe(v.number(), v.integer(), v.minValue(0)),
    stocked: v.optional(v.boolean()),
  }),
  v.metadata({ ref: 'Item' }),
)

export type Item = v.InferOutput<typeof ItemSchema>

export const FieldsResponse = {
  description: 'Every validated field, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(v.any()) } },
}
