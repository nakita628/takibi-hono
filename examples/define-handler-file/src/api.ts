import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import * as z from 'zod'

import { store } from './store'

export const UserSchema = z.object({ id: z.int(), name: z.string().min(1) })

export type User = z.infer<typeof UserSchema>

export const NewUserSchema = z.object({ name: z.string().min(1) })

export type NewUser = z.infer<typeof NewUserSchema>

export const PostSchema = z.object({ id: z.int(), authorId: z.int(), title: z.string().min(1) })

export type Post = z.infer<typeof PostSchema>

export const NewPostSchema = z.object({ authorId: z.int().min(1), title: z.string().min(1) })

export type NewPost = z.infer<typeof NewPostSchema>

export const ErrorSchema = z.object({ message: z.string() })

export type Error = z.infer<typeof ErrorSchema>

export const getHealthHandler = defineHandler({ response: z.object({ status: z.literal('ok') }) })(
  async (c) => ({ status: 'ok' as const }),
)

export const getUsersHandler = defineHandler({
  query: z.object({ limit: z.coerce.number().int().min(1).max(100).default(20).exactOptional() }),
  response: z.array(UserSchema),
})(async (c, { query }) => store.users().slice(0, query.limit ?? 20))

export const postUsersHandler = defineHandler({ json: NewUserSchema, response: UserSchema })(async (
  c,
  { json },
) => {
  c.status(201)
  return store.addUser(json.name)
})

export const getUsersUserIdHandler = defineHandler({
  param: z.object({ userId: z.coerce.number().int().min(1) }),
  response: UserSchema,
})(async (c, { param }) => {
  const user = store.user(param.userId)
  if (!user) throw new HTTPException(404, { res: c.json({ message: 'user not found' }, 404) })
  return user
})

export const getPostsHandler = defineHandler({
  query: z.object({ authorId: z.coerce.number().int().min(1).exactOptional() }),
  response: z.array(PostSchema),
})(async (c, { query }) => store.posts(query.authorId))

export const postPostsHandler = defineHandler({ json: NewPostSchema, response: PostSchema })(async (
  c,
  { json },
) => {
  c.status(201)
  return store.addPost(json.authorId, json.title)
})

export const api = new Hono()
  .get('/health', getHealthHandler)
  .get('/users', getUsersHandler)
  .post('/users', postUsersHandler)
  .get('/users/:userId', getUsersUserIdHandler)
  .get('/posts', getPostsHandler)
  .post('/posts', postPostsHandler)
