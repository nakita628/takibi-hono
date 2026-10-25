import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import * as z from 'zod'

import { UserSchema, NewUserSchema } from '../components'
import { store } from '../store'

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

export const usersHandler = new Hono()
  .get('/users', getUsersHandler)
  .post('/users', postUsersHandler)
  .get('/users/:userId', getUsersUserIdHandler)
