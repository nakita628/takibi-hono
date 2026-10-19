import { resolver } from 'hono-openapi'
import * as z from 'zod'

export const PageParamsSchema = resolver(z.coerce.number().int().min(1).default(1))

export type PageParamsSchema = z.infer<typeof PageParamsSchema>
