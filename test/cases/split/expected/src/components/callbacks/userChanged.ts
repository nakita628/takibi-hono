import { resolver } from 'hono-openapi'
import { UserSchema } from '@/components/schemas'

export const UserChangedCallback = {
  '{$request.body#/callbackUrl}': {
    post: {
      requestBody: { content: { 'application/json': { schema: resolver(UserSchema) } } },
      responses: { '200': { description: 'Received' } },
    },
  },
} as const
