import { resolver } from 'hono-openapi'
import { Schema } from 'effect'

export const CountSchema = Schema.Number.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0),
).annotate({ identifier: 'Count' })

export type Count = Schema.Schema.Type<typeof CountSchema>

export const IdParamsSchema = resolver(
  Schema.toStandardSchemaV1(
    Schema.BigIntFromString.check(
      Schema.isBetweenBigInt({ minimum: -9223372036854775808n, maximum: 9223372036854775807n }),
    ),
  ),
)

export const EchoResponse = {
  description: 'The runtime typeof the path parameter, and its value verbatim.',
  content: {
    'application/json': {
      schema: resolver(
        Schema.toStandardSchemaV1(
          Schema.Struct({ valueType: Schema.String, valueText: Schema.String }),
        ),
      ),
    },
  },
}
export const FieldsResponse = {
  description: 'The runtime typeof and the verbatim value of each path parameter, by name.',
  content: {
    'application/json': {
      schema: resolver(
        Schema.toStandardSchemaV1(
          Schema.Record(
            Schema.String,
            Schema.Struct({ valueType: Schema.String, valueText: Schema.String }),
          ),
        ),
      ),
    },
  },
}
