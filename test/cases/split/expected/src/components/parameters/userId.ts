import { resolver } from 'hono-openapi'
import * as z from 'zod'

export const UserIdParamsSchema = resolver(z.uuid())

export type UserIdParamsSchema = z.infer<typeof UserIdParamsSchema>
