import { resolver } from 'hono-openapi'
import * as z from 'zod'

export const CountSchema = z.int().min(0).meta({ ref: 'Count' })

export type Count = z.infer<typeof CountSchema>

export const IdParamsSchema = resolver(z.coerce.bigint().pipe(z.int64()))

export const EchoResponse = {
  description: 'The runtime typeof the path parameter, and its value verbatim.',
  content: {
    'application/json': {
      schema: resolver(z.object({ valueType: z.string(), valueText: z.string() })),
    },
  },
}
export const FieldsResponse = {
  description: 'The runtime typeof and the verbatim value of each path parameter, by name.',
  content: {
    'application/json': {
      schema: resolver(
        z.record(z.string(), z.object({ valueType: z.string(), valueText: z.string() })),
      ),
    },
  },
}
