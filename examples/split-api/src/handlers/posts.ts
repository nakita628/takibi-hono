import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as z from 'zod'

import { PostSchema, NewPostSchema } from '../components'
import { store } from '../store'

export const postsHandler = new Hono()
  .get(
    '/posts',
    describeRoute({
      operationId: 'listPosts',
      summary: 'List posts',
      responses: {
        '200': {
          description: 'The posts',
          content: { 'application/json': { schema: resolver(z.array(PostSchema)) } },
        },
      },
    }),
    validator('query', z.object({ authorId: z.coerce.number().int().min(1).exactOptional() })),
    (c) => c.json(store.posts(c.req.valid('query').authorId), 200),
  )
  .post(
    '/posts',
    describeRoute({
      operationId: 'createPost',
      summary: 'Create a post',
      responses: {
        '201': {
          description: 'Created',
          content: { 'application/json': { schema: resolver(PostSchema) } },
        },
      },
    }),
    validator('json', NewPostSchema),
    (c) => {
      const { authorId, title } = c.req.valid('json')
      return c.json(store.addPost(authorId, title), 201)
    },
  )
