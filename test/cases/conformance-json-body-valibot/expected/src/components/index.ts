import { resolver } from 'hono-openapi'
import * as v from 'valibot'

export const IdSchema = v.pipe(
  v.pipe(v.number(), v.integer(), v.minValue(0)),
  v.metadata({ ref: 'Id' }),
)

export type Id = v.InferOutput<typeof IdSchema>

export const FieldsResponse = {
  description: 'Every validated field, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(v.any()) } },
}
