import { resolver } from 'hono-openapi'
import * as z from 'zod'

type NodeType = { id: string; children?: NodeType[] }

export const NodeSchema: z.ZodType<NodeType> = z
  .object({ id: z.string(), children: z.array(z.lazy(() => NodeSchema)).exactOptional() })
  .meta({ ref: 'Node' })

export type Node = z.infer<typeof NodeSchema>

type AuthorType = { name?: string; posts?: z.infer<typeof PostSchema>[] }

export const AuthorSchema: z.ZodType<AuthorType> = z
  .object({
    name: z.string().exactOptional(),
    posts: z.array(z.lazy(() => PostSchema)).exactOptional(),
  })
  .meta({ ref: 'Author' })

export type Author = z.infer<typeof AuthorSchema>

type PostType = { title: string; author?: z.infer<typeof AuthorSchema> }

export const PostSchema: z.ZodType<PostType> = z
  .object({ title: z.string(), author: z.lazy(() => AuthorSchema).exactOptional() })
  .meta({ ref: 'Post' })

export type Post = z.infer<typeof PostSchema>

export const UserSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    role: z.enum(['admin', 'member']).default('member').exactOptional(),
  })
  .meta({ ref: 'User' })

export type User = z.infer<typeof UserSchema>

export const UserIdParamsSchema = resolver(z.uuid())
export const PageParamsSchema = resolver(z.coerce.number().int().min(1).default(1))

export const RateLimitHeaderSchema = resolver(z.int())

export const BearerSecurityScheme = { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }

export const UserBodyRequestBody = {
  required: true,
  content: { 'application/json': { schema: resolver(UserSchema) } },
}

export const UserFoundResponse = {
  description: 'The user',
  headers: { 'X-Rate-Limit': { $ref: '#/components/headers/RateLimit' } },
  content: {
    'application/json': {
      schema: resolver(UserSchema),
      examples: { admin: { $ref: '#/components/examples/Admin' } },
    },
  },
}
export const NotFoundResponse = { description: 'Not found' }

export const AdminExample = {
  summary: 'An administrator',
  value: { id: '7e6c0e40-9f1e-4b6e-9b2a-2e5b8a0c1d11', email: 'admin@example.com', role: 'admin' },
}

export const GetUserLink = { operationId: 'getUser', parameters: { userId: '$response.body#/id' } }

export const UserChangedCallback = {
  '{$request.body#/callbackUrl}': {
    post: {
      requestBody: { content: { 'application/json': { schema: resolver(UserSchema) } } },
      responses: { '200': { description: 'Received' } },
    },
  },
}

export const NodesPathItem = {
  get: {
    operationId: 'listNodes',
    parameters: [{ $ref: '#/components/parameters/Page' }],
    responses: {
      '200': {
        description: 'The nodes',
        content: { 'application/json': { schema: resolver(z.array(NodeSchema)) } },
      },
    },
  },
}
