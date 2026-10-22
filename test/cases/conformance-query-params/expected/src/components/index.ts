import { resolver } from 'hono-openapi'
import * as z from 'zod'

export const CountSchema = z.int().min(0).meta({ ref: 'Count' })

export type Count = z.infer<typeof CountSchema>

export const CountAliasSchema = CountSchema

export type CountAlias = z.infer<typeof CountAliasSchema>

export const BigSchema = z.int64().meta({ ref: 'Big' })

export type Big = z.infer<typeof BigSchema>

export const RatioSchema = z.number().meta({ ref: 'Ratio' })

export type Ratio = z.infer<typeof RatioSchema>

export const FlagSchema = z.boolean().meta({ ref: 'Flag' })

export type Flag = z.infer<typeof FlagSchema>

export const LevelSchema = z
  .union([z.literal(1), z.literal(2), z.literal(3)])
  .meta({ ref: 'Level' })

export type Level = z.infer<typeof LevelSchema>

export const NameSchema = z.string().min(2).meta({ ref: 'Name' })

export type Name = z.infer<typeof NameSchema>

export const CountsSchema = z.array(z.int()).meta({ ref: 'Counts' })

export type Counts = z.infer<typeof CountsSchema>

export const RangeSchema = z
  .object({ from: z.int(), to: z.int().exactOptional() })
  .meta({ ref: 'Range' })

export type Range = z.infer<typeof RangeSchema>

export const FieldsResponse = {
  description:
    'Every validated parameter, by name, as the runtime typeof and the text of its value.',
  content: { 'application/json': { schema: resolver(z.any()) } },
}
