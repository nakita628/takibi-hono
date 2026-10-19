import { resolver } from 'hono-openapi'
import { type, scope } from 'arktype'

declare global {
  interface ArkEnv {
    meta(): { ref?: string }
  }
}

export const NodeSchema = scope({ NodeSchema: { id: 'string', 'children?': 'NodeSchema[]' } })
  .export()
  .NodeSchema.configure({ ref: 'Node' })

export type Node = typeof NodeSchema.infer

export const AuthorSchema = scope({
  PostSchema: { title: 'string', 'author?': 'AuthorSchema' },
  AuthorSchema: { 'name?': 'string', 'posts?': 'PostSchema[]' },
})
  .export()
  .AuthorSchema.configure({ ref: 'Author' })

export type Author = typeof AuthorSchema.infer

export const PostSchema = scope({
  PostSchema: { title: 'string', 'author?': 'AuthorSchema' },
  AuthorSchema: { 'name?': 'string', 'posts?': 'PostSchema[]' },
})
  .export()
  .PostSchema.configure({ ref: 'Post' })

export type Post = typeof PostSchema.infer

export const UserSchema = type({
  id: 'string.uuid',
  email: 'string.email',
  'role?': "'admin' | 'member'",
}).configure({ ref: 'User' })

export type User = typeof UserSchema.infer

export const UserIdParamsSchema = resolver(type('string.uuid'))
export const PageParamsSchema = resolver(type('string.integer.parse').to('number.integer >= 1'))

export const RateLimitHeaderSchema = resolver(type('number.integer'))

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
        content: { 'application/json': { schema: resolver(type(NodeSchema).array()) } },
      },
    },
  },
}
