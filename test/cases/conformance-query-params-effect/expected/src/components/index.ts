import { resolver } from 'hono-openapi'
import { Schema } from 'effect'

export const CountSchema = Schema.Number.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0),
).annotate({ identifier: 'Count' })

export type Count = Schema.Schema.Type<typeof CountSchema>

export const CountAliasSchema = CountSchema

export type CountAlias = Schema.Schema.Type<typeof CountAliasSchema>

export const BigSchema = Schema.Number.check(Schema.isInt()).annotate({ identifier: 'Big' })

export type Big = Schema.Schema.Type<typeof BigSchema>

export const RatioSchema = Schema.Number.annotate({ identifier: 'Ratio' })

export type Ratio = Schema.Schema.Type<typeof RatioSchema>

export const FlagSchema = Schema.Boolean.annotate({ identifier: 'Flag' })

export type Flag = Schema.Schema.Type<typeof FlagSchema>

export const LevelSchema = Schema.Literals([1, 2, 3]).annotate({ identifier: 'Level' })

export type Level = Schema.Schema.Type<typeof LevelSchema>

export const NameSchema = Schema.String.check(Schema.isMinLength(2)).annotate({
  identifier: 'Name',
})

export type Name = Schema.Schema.Type<typeof NameSchema>

export const CountsSchema = Schema.Array(Schema.Number.check(Schema.isInt())).annotate({
  identifier: 'Counts',
})

export type Counts = Schema.Schema.Type<typeof CountsSchema>

export const RangeSchema = Schema.Struct({
  from: Schema.Number.check(Schema.isInt()),
  to: Schema.optional(Schema.Number.check(Schema.isInt())),
}).annotate({ identifier: 'Range' })

export type Range = Schema.Schema.Type<typeof RangeSchema>

export const FieldsResponse = {
  description:
    'Every validated parameter, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(Schema.toStandardSchemaV1(Schema.Unknown)) } },
}
