// The app, written by hand: every operation of src/routes.ts registered with its handler. A
// definition is called with the handler (and any middleware before it); the handler gets the
// validated values as its second argument and returns the value, which the definition's
// `response` schema validates. The status is set with `c.status()`, and a miss is thrown as an
// `HTTPException` with the response to send: a JSON Response would bypass the response schema,
// and the types refuse it.
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

import {
  getHealthHandler,
  getPostsHandler,
  getUsersHandler,
  getUsersUserIdHandler,
  postPostsHandler,
  postUsersHandler,
} from './routes'
import { store } from './store'

const app = new Hono().basePath('/api')

export const api = app
  .get(
    '/health',
    getHealthHandler(async () => ({ status: 'ok' as const })),
  )
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
  .get(
    '/posts',
    getPostsHandler(async (c, { query }) => store.posts(query.authorId)),
  )
  .post(
    '/posts',
    postPostsHandler(async (c, { json }) => {
      c.status(201)
      return store.addPost(json.authorId, json.title)
    }),
  )

app.notFound((c) => c.json({ message: 'no such route' }, 404))

export default app
