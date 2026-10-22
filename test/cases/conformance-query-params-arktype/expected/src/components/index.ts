import { resolver } from 'hono-openapi'
import { type } from 'arktype'

declare global {
  interface ArkEnv {
    meta(): { ref?: string }
  }
}

export const CountSchema = type('number.integer >= 0').configure({ ref: 'Count' })

export type Count = typeof CountSchema.infer

export const CountAliasSchema = CountSchema

export type CountAlias = typeof CountAliasSchema.infer

export const BigSchema = type('number.integer').configure({ ref: 'Big' })

export type Big = typeof BigSchema.infer

export const RatioSchema = type('number').configure({ ref: 'Ratio' })

export type Ratio = typeof RatioSchema.infer

export const FlagSchema = type('boolean').configure({ ref: 'Flag' })

export type Flag = typeof FlagSchema.infer

export const LevelSchema = type('1 | 2 | 3').configure({ ref: 'Level' })

export type Level = typeof LevelSchema.infer

export const NameSchema = type('string >= 2').configure({ ref: 'Name' })

export type Name = typeof NameSchema.infer

export const CountsSchema = type('number.integer[]').configure({ ref: 'Counts' })

export type Counts = typeof CountsSchema.infer

export const RangeSchema = type({ from: 'number.integer', 'to?': 'number.integer' }).configure({
  ref: 'Range',
})

export type Range = typeof RangeSchema.infer

export const FieldsResponse = {
  description:
    'Every validated parameter, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(type('unknown')) } },
}
