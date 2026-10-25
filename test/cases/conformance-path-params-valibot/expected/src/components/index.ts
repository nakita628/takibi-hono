import { resolver } from 'hono-openapi'
import * as v from 'valibot'

export const CountSchema = v.pipe(
  v.pipe(v.number(), v.integer(), v.minValue(0)),
  v.metadata({ ref: 'Count' }),
)

export type Count = v.InferOutput<typeof CountSchema>

export const IdParamsSchema = resolver(
  v.pipe(
    v.string(),
    v.regex(/^-?\d+$/),
    v.transform((input) => BigInt(input)),
    v.minValue(-9223372036854775808n),
    v.maxValue(9223372036854775807n),
  ),
)

export const EchoResponse = {
  description: 'The runtime typeof the path parameter, and its value verbatim.',
  content: {
    'application/json': {
      schema: resolver(v.object({ valueType: v.string(), valueText: v.string() })),
    },
  },
}
export const FieldsResponse = {
  description: 'The runtime typeof and the verbatim value of each path parameter, by name.',
  content: {
    'application/json': {
      schema: resolver(
        v.record(v.string(), v.object({ valueType: v.string(), valueText: v.string() })),
      ),
    },
  },
}
