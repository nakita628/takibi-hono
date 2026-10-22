import { resolver } from 'hono-openapi'
import { type } from 'arktype'

declare global {
  interface ArkEnv {
    meta(): { ref?: string }
  }
}

export const CountSchema = type('number.integer >= 0').configure({ ref: 'Count' })

export type Count = typeof CountSchema.infer

export const FieldsResponse = {
  description:
    'Every validated parameter, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(type('unknown')) } },
}
