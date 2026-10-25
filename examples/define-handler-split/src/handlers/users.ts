import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { getUsersHandler, postUsersHandler, getUsersUserIdHandler } from '../routes'
import { store } from '../store'

export const usersHandler = new Hono()
  .get(
    '/users',
    getUsersHandler(async (c, { query }) => store.users().slice(0, query.limit ?? 20)),
  )
  .post(
    '/users',
    postUsersHandler(async (c, { json }) => {
      c.status(201)
      return store.addUser(json.name)
    }),
  )
  .get(
    '/users/:userId',
    getUsersUserIdHandler(async (c, { param }) => {
      const user = store.user(param.userId)
      if (!user) throw new HTTPException(404, { res: c.json({ message: 'user not found' }, 404) })
      return user
    }),
  )
