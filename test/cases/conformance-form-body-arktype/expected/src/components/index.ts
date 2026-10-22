import { resolver } from 'hono-openapi'
import { type } from 'arktype'

declare global {
  interface ArkEnv {
    meta(): { ref?: string }
  }
}

export const CountSchema = type('number.integer >= 0').configure({ ref: 'Count' })

export type Count = typeof CountSchema.infer

export const FlagSchema = type('boolean').configure({ ref: 'Flag' })

export type Flag = typeof FlagSchema.infer

export const ItemSchema = type({
  name: 'string',
  price: 'number.integer >= 0',
  'stocked?': 'boolean',
}).configure({ ref: 'Item' })

export type Item = typeof ItemSchema.infer

export const FieldsResponse = {
  description: 'Every validated field, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(type('unknown')) } },
}
