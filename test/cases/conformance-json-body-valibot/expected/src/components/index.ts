import { resolver } from 'hono-openapi'
import * as v from 'valibot'

export const IdSchema = v.pipe(
  v.pipe(
    v.union([v.bigint(), v.pipe(v.number(), v.integer()), v.pipe(v.string(), v.regex(/^-?\d+$/))]),
    v.transform((input) => BigInt(input)),
    v.minValue(-9223372036854775808n),
    v.maxValue(9223372036854775807n),
    v.minValue(0n),
  ),
  v.metadata({ ref: 'Id' }),
)

export type Id = v.InferOutput<typeof IdSchema>

export const FieldsResponse = {
  description: 'Every validated field, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(v.any()) } },
}
