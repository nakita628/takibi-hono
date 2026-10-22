import { resolver } from 'hono-openapi'
import { Schema } from 'effect'

export const IdSchema = Schema.Number.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0),
).annotate({ identifier: 'Id' })

export type Id = Schema.Schema.Type<typeof IdSchema>

export const FieldsResponse = {
  description: 'Every validated field, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(Schema.toStandardSchemaV1(Schema.Unknown)) } },
}
