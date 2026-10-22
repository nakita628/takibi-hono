import { resolver } from 'hono-openapi'
import { type } from 'arktype'

declare global {
  interface ArkEnv {
    meta(): { ref?: string }
  }
}

export const IdSchema = type('number.integer >= 0').configure({ ref: 'Id' })

export type Id = typeof IdSchema.infer

export const FieldsResponse = {
  description: 'Every validated field, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(type('unknown')) } },
}
