import { Schema } from 'effect'

export const TestSchema = Schema.Struct({
  hono: Schema.Literal('Hono', 'HonoX', 'ZodOpenAPIHOno'),
}).annotations({ examples: [{ hono: 'Hono' }] })

export type Test = typeof TestSchema.Encoded
