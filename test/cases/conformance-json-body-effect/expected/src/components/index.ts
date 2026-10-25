import { resolver } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'

export const IdSchema = Schema.Union([
  Schema.BigInt,
  Schema.Number.check(Schema.isInt()),
  Schema.String.check(Schema.isPattern(/^-?\d+$/)),
])
  .pipe(
    Schema.decodeTo(
      Schema.BigInt,
      SchemaTransformation.transform({
        decode: (input) => BigInt(input),
        encode: (output) => output,
      }),
    ),
  )
  .check(
    Schema.isBetweenBigInt({ minimum: -9223372036854775808n, maximum: 9223372036854775807n }),
    Schema.isGreaterThanOrEqualToBigInt(0n),
  )
  .annotate({ identifier: 'Id' })

export type Id = Schema.Schema.Type<typeof IdSchema>

export const FieldsResponse = {
  description: 'Every validated field, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(Schema.toStandardSchemaV1(Schema.Unknown)) } },
}
