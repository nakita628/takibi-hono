import { Hono } from 'hono'

import { getPostsHandler, postPostsHandler } from '../routes'
import { store } from '../store'

export const postsHandler = new Hono()
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
