import { Hono } from 'hono'
import { defineHandler } from 'hono/factory'
import * as z from 'zod'

import { PostSchema, NewPostSchema } from '../components'
import { store } from '../store'

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

export const postsHandler = new Hono()
  .get('/posts', getPostsHandler)
  .post('/posts', postPostsHandler)
