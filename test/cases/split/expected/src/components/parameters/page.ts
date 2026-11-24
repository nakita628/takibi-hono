import { resolver } from 'hono-openapi'
import * as z from 'zod'

export const PageParamsSchema = resolver(
  z
    .preprocess(
      (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
      z.number().int().min(1),
    )
    .default(1),
)

export type PageParamsSchema = z.infer<typeof PageParamsSchema>
