import { resolver } from 'hono-openapi'
import * as z from 'zod'

export const PageParamsSchema = resolver(
  z
    .string()
    .regex(/^-?(?:0|[1-9]\d*)$/)
    .transform((val) => Number(val))
    .pipe(z.number().int().min(1))
    .default(1),
)

export type PageParamsSchema = z.infer<typeof PageParamsSchema>
