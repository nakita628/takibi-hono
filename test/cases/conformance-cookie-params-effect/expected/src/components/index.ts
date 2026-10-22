import { resolver } from 'hono-openapi'
import { Schema } from 'effect'

export const CountSchema = Schema.Number.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0),
).annotate({ identifier: 'Count' })

export type Count = Schema.Schema.Type<typeof CountSchema>

export const FieldsResponse = {
  description:
    'Every validated parameter, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(Schema.toStandardSchemaV1(Schema.Unknown)) } },
}
