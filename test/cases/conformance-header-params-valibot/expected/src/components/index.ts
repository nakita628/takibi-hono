import { resolver } from 'hono-openapi'
import * as v from 'valibot'

export const CountSchema = v.pipe(
  v.pipe(v.number(), v.integer(), v.minValue(0)),
  v.metadata({ ref: 'Count' }),
)

export type Count = v.InferOutput<typeof CountSchema>

export const FieldsResponse = {
  description:
    'Every validated parameter, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(v.any()) } },
}
