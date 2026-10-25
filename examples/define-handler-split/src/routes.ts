import { defineHandler } from 'hono/factory'
import * as z from 'zod'

import { UserSchema, NewUserSchema, PostSchema, NewPostSchema } from './components'

export const getHealthHandler = defineHandler({ response: z.object({ status: z.literal('ok') }) })

export const getUsersHandler = defineHandler({
  query: z.object({ limit: z.coerce.number().int().min(1).max(100).default(20).exactOptional() }),
  response: z.array(UserSchema),
})

export const postUsersHandler = defineHandler({ json: NewUserSchema, response: UserSchema })

export const getUsersUserIdHandler = defineHandler({
  param: z.object({ userId: z.coerce.number().int().min(1) }),
  response: UserSchema,
})

export const getPostsHandler = defineHandler({
  query: z.object({ authorId: z.coerce.number().int().min(1).exactOptional() }),
  response: z.array(PostSchema),
})

export const postPostsHandler = defineHandler({ json: NewPostSchema, response: PostSchema })
