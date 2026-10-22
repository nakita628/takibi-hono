import { resolver } from 'hono-openapi'
import * as z from 'zod'

export const RateLimitHeaderSchema = resolver(z.int())

export type RateLimitHeaderSchema = z.infer<typeof RateLimitHeaderSchema>
