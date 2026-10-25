import { resolver } from 'hono-openapi'
import { Schema } from 'effect'

export const CountSchema = Schema.Number.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0),
).annotate({ identifier: 'Count' })

export type Count = Schema.Schema.Type<typeof CountSchema>

export const FlagSchema = Schema.Boolean.annotate({ identifier: 'Flag' })

export type Flag = Schema.Schema.Type<typeof FlagSchema>

export const ItemSchema = Schema.Struct({
  name: Schema.String,
  price: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
  stocked: Schema.optional(Schema.Boolean),
}).annotate({ identifier: 'Item' })

export type Item = Schema.Schema.Type<typeof ItemSchema>

export const FieldsResponse = {
  description: 'Every validated field, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(Schema.toStandardSchemaV1(Schema.Unknown)) } },
}
