import { resolver, validator } from 'hono-openapi'
import {
  Type,
  Codec,
  type Static,
  type StaticDecode,
  type StaticEncode,
  type TSchema,
} from 'typebox'
import { Compile } from 'typebox/compile'

const toStandardSchemaV1 = <T extends TSchema>(schema: T) => {
  const validator = Compile(schema)
  return Object.assign(validator, {
    '~standard': {
      version: 1 as const,
      vendor: 'typebox',
      validate: (value: unknown) =>
        validator.Check(value)
          ? { value: validator.Decode(value) }
          : {
              issues: validator.Errors(value).map((error) => ({
                message: error.message,
                path: error.instancePath
                  .split('/')
                  .slice(1)
                  .map((key) => key.replaceAll('~1', '/').replaceAll('~0', '~')),
              })),
            },
      types: undefined as
        | { readonly input: StaticEncode<T>; readonly output: StaticDecode<T> }
        | undefined,
    },
  })
}

export const NodeSchema = Type.Cyclic(
  {
    NodeSchema: Type.Object({
      id: Type.String(),
      children: Type.Optional(Type.Array(Type.Ref('NodeSchema'))),
    }),
  },
  'NodeSchema',
  { ref: 'Node' },
)

export type Node = Static<typeof NodeSchema>

export const AuthorSchema = Type.Cyclic(
  {
    PostSchema: Type.Object({
      title: Type.String(),
      author: Type.Optional(Type.Ref('AuthorSchema')),
    }),
    AuthorSchema: Type.Object({
      name: Type.Optional(Type.String()),
      posts: Type.Optional(Type.Array(Type.Ref('PostSchema'))),
    }),
  },
  'AuthorSchema',
  { ref: 'Author' },
)

export type Author = Static<typeof AuthorSchema>

export const PostSchema = Type.Cyclic(
  {
    AuthorSchema: Type.Object({
      name: Type.Optional(Type.String()),
      posts: Type.Optional(Type.Array(Type.Ref('PostSchema'))),
    }),
    PostSchema: Type.Object({
      title: Type.String(),
      author: Type.Optional(Type.Ref('AuthorSchema')),
    }),
  },
  'PostSchema',
  { ref: 'Post' },
)

export type Post = Static<typeof PostSchema>

export const UserSchema = Type.Object(
  {
    id: Type.String({ format: 'uuid' }),
    email: Type.String({ format: 'email' }),
    role: Type.Optional(
      Type.Union([Type.Literal('admin'), Type.Literal('member')], { default: 'member' }),
    ),
  },
  { ref: 'User' },
)

export type User = Static<typeof UserSchema>

export const UserIdParamsSchema = resolver(toStandardSchemaV1(Type.String({ format: 'uuid' })))
export const PageParamsSchema = resolver(
  toStandardSchemaV1(
    Type.Optional(
      Codec(
        Type.Refine(
          Type.String({ pattern: '^-?(?:0|[1-9]\\d*)$', default: '1' }),
          (value) => Number(value) >= 1,
          () => 'must be >= 1',
        ),
      )
        .Decode((value) => Number(value))
        .Encode((value) => String(value)),
    ),
  ),
)

export const RateLimitHeaderSchema = resolver(toStandardSchemaV1(Type.Integer()))

export const BearerSecurityScheme = { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }

export const UserBodyRequestBody = {
  required: true,
  content: { 'application/json': { schema: resolver(toStandardSchemaV1(UserSchema)) } },
}

export const UserFoundResponse = {
  description: 'The user',
  headers: { 'X-Rate-Limit': { $ref: '#/components/headers/RateLimit' } },
  content: {
    'application/json': {
      schema: resolver(toStandardSchemaV1(UserSchema)),
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
        content: { 'application/json': { schema: resolver(toStandardSchemaV1(UserSchema)) } },
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
          'application/json': { schema: resolver(toStandardSchemaV1(Type.Array(NodeSchema))) },
        },
      },
    },
  },
}
