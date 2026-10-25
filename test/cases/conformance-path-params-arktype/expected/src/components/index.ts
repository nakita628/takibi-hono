import { resolver } from 'hono-openapi'
import { type } from 'arktype'

declare global {
  interface ArkEnv {
    meta(): { ref?: string }
  }
}

export const CountSchema = type('number.integer >= 0').configure({ ref: 'Count' })

export type Count = typeof CountSchema.infer

export const IdParamsSchema = resolver(
  type('string')
    .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
    .narrow(
      (data, ctx) =>
        (data >= -9223372036854775808n && data <= 9223372036854775807n) || ctx.mustBe('an int64'),
    ),
)

export const EchoResponse = {
  description: 'The runtime typeof the path parameter, and its value verbatim.',
  content: {
    'application/json': { schema: resolver(type({ valueType: 'string', valueText: 'string' })) },
  },
}
export const FieldsResponse = {
  description: 'The runtime typeof and the verbatim value of each path parameter, by name.',
  content: {
    'application/json': {
      schema: resolver(type({ '[string]': type({ valueType: 'string', valueText: 'string' }) })),
    },
  },
}
