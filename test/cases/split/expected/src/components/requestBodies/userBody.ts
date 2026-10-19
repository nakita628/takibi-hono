import { resolver } from 'hono-openapi'
import { UserSchema } from '@/components/schemas'

export const UserBodyRequestBody = {
  required: true,
  content: { 'application/json': { schema: resolver(UserSchema) } },
} as const
