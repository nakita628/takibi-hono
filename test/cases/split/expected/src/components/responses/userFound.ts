import { resolver } from 'hono-openapi'
import { UserSchema } from '@/components/schemas'

export const UserFoundResponse = {
  description: 'The user',
  headers: { 'X-Rate-Limit': { $ref: '#/components/headers/RateLimit' } },
  content: {
    'application/json': {
      schema: resolver(UserSchema),
      examples: { admin: { $ref: '#/components/examples/Admin' } },
    },
  },
} as const
