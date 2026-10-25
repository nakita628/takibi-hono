import { resolver } from 'hono-openapi'
import { Effect, Schema } from 'effect'

type NodeType = { id: string; children?: readonly NodeType[] | undefined }

export const NodeSchema: Schema.Codec<NodeType> = Schema.Struct({
  id: Schema.String,
  children: Schema.optional(Schema.Array(Schema.suspend(() => NodeSchema))),
}).annotate({ identifier: 'Node' })

export type Node = Schema.Schema.Type<typeof NodeSchema>

type AuthorType = {
  name?: string | undefined
  posts?: readonly Schema.Schema.Type<typeof PostSchema>[] | undefined
}

export const AuthorSchema: Schema.Codec<AuthorType> = Schema.Struct({
  name: Schema.optional(Schema.String),
  posts: Schema.optional(Schema.Array(Schema.suspend(() => PostSchema))),
}).annotate({ identifier: 'Author' })

export type Author = Schema.Schema.Type<typeof AuthorSchema>

type PostType = { title: string; author?: Schema.Schema.Type<typeof AuthorSchema> | undefined }

export const PostSchema: Schema.Codec<PostType> = Schema.Struct({
  title: Schema.String,
  author: Schema.optional(Schema.suspend(() => AuthorSchema)),
}).annotate({ identifier: 'Post' })

export type Post = Schema.Schema.Type<typeof PostSchema>

export const UserSchema = Schema.Struct({
  id: Schema.String.check(Schema.isUUID()),
  email: Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
  role: Schema.Literals(['admin', 'member']).pipe(
    Schema.withDecodingDefault(Effect.succeed('member')),
  ),
}).annotate({ identifier: 'User' })

export type User = Schema.Schema.Type<typeof UserSchema>

export const UserIdParamsSchema = resolver(
  Schema.toStandardSchemaV1(Schema.String.check(Schema.isUUID())),
)
export const PageParamsSchema = resolver(
  Schema.toStandardSchemaV1(
    Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)).pipe(
      Schema.withDecodingDefaultType(Effect.succeed(1)),
    ),
  ),
)

export const RateLimitHeaderSchema = resolver(
  Schema.toStandardSchemaV1(Schema.Number.check(Schema.isInt())),
)

export const BearerSecurityScheme = { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }

export const UserBodyRequestBody = {
  required: true,
  content: { 'application/json': { schema: resolver(Schema.toStandardSchemaV1(UserSchema)) } },
}

export const UserFoundResponse = {
  description: 'The user',
  headers: { 'X-Rate-Limit': { $ref: '#/components/headers/RateLimit' } },
  content: {
    'application/json': {
      schema: resolver(Schema.toStandardSchemaV1(UserSchema)),
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
      requestBody: {
        content: {
          'application/json': { schema: resolver(Schema.toStandardSchemaV1(UserSchema)) },
        },
      },
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
        content: {
          'application/json': {
            schema: resolver(Schema.toStandardSchemaV1(Schema.Array(NodeSchema))),
          },
        },
      },
    },
  },
}
