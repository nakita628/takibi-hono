import { resolver } from 'hono-openapi'
import * as v from 'valibot'

type NodeType = { id: string; children?: NodeType[] | undefined }

export const NodeSchema: v.GenericSchema<NodeType> = v.pipe(
  v.object({ id: v.string(), children: v.optional(v.array(v.lazy(() => NodeSchema))) }),
  v.metadata({ ref: 'Node' }),
)

export type Node = v.InferOutput<typeof NodeSchema>

type AuthorType = {
  name?: string | undefined
  posts?: v.InferOutput<typeof PostSchema>[] | undefined
}

export const AuthorSchema: v.GenericSchema<AuthorType> = v.pipe(
  v.partial(v.object({ name: v.string(), posts: v.array(v.lazy(() => PostSchema)) })),
  v.metadata({ ref: 'Author' }),
)

export type Author = v.InferOutput<typeof AuthorSchema>

type PostType = { title: string; author?: v.InferOutput<typeof AuthorSchema> | undefined }

export const PostSchema: v.GenericSchema<PostType> = v.pipe(
  v.object({ title: v.string(), author: v.optional(v.lazy(() => AuthorSchema)) }),
  v.metadata({ ref: 'Post' }),
)

export type Post = v.InferOutput<typeof PostSchema>

export const UserSchema = v.pipe(
  v.object({
    id: v.pipe(
      v.string(),
      v.regex(
        /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
      ),
    ),
    email: v.pipe(v.string(), v.email()),
    role: v.optional(v.picklist(['admin', 'member']), 'member'),
  }),
  v.metadata({ ref: 'User' }),
)

export type User = v.InferOutput<typeof UserSchema>

export const UserIdParamsSchema = resolver(
  v.pipe(
    v.string(),
    v.regex(
      /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
    ),
  ),
)
export const PageParamsSchema = resolver(
  v.optional(
    v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger(), v.minValue(1)),
    '1',
  ),
)

export const RateLimitHeaderSchema = resolver(v.pipe(v.number(), v.integer()))

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
        content: { 'application/json': { schema: resolver(v.array(NodeSchema)) } },
      },
    },
  },
}
