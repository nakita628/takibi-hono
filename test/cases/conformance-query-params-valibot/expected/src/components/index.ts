import { resolver } from 'hono-openapi'
import * as v from 'valibot'

export const CountSchema = v.pipe(
  v.pipe(v.number(), v.integer(), v.minValue(0)),
  v.metadata({ ref: 'Count' }),
)

export type Count = v.InferOutput<typeof CountSchema>

export const CountAliasSchema = CountSchema

export type CountAlias = v.InferOutput<typeof CountAliasSchema>

export const BigSchema = v.pipe(
  v.pipe(
    v.union([v.bigint(), v.pipe(v.number(), v.integer()), v.pipe(v.string(), v.regex(/^-?\d+$/))]),
    v.transform((input) => BigInt(input)),
    v.minValue(-9223372036854775808n),
    v.maxValue(9223372036854775807n),
  ),
  v.metadata({ ref: 'Big' }),
)

export type Big = v.InferOutput<typeof BigSchema>

export const RatioSchema = v.pipe(v.number(), v.metadata({ ref: 'Ratio' }))

export type Ratio = v.InferOutput<typeof RatioSchema>

export const FlagSchema = v.pipe(v.boolean(), v.metadata({ ref: 'Flag' }))

export type Flag = v.InferOutput<typeof FlagSchema>

export const LevelSchema = v.pipe(
  v.union([v.literal(1), v.literal(2), v.literal(3)]),
  v.metadata({ ref: 'Level' }),
)

export type Level = v.InferOutput<typeof LevelSchema>

export const NameSchema = v.pipe(
  v.pipe(v.string(), v.minCodePoints(2)),
  v.metadata({ ref: 'Name' }),
)

export type Name = v.InferOutput<typeof NameSchema>

export const CountsSchema = v.pipe(
  v.array(v.pipe(v.number(), v.integer())),
  v.metadata({ ref: 'Counts' }),
)

export type Counts = v.InferOutput<typeof CountsSchema>

export const RangeSchema = v.pipe(
  v.object({
    from: v.pipe(v.number(), v.integer()),
    to: v.optional(v.pipe(v.number(), v.integer())),
  }),
  v.metadata({ ref: 'Range' }),
)

export type Range = v.InferOutput<typeof RangeSchema>

export const FieldsResponse = {
  description:
    'Every validated parameter, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(v.any()) } },
}
