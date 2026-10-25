import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as z from 'zod'

import { UserSchema, NewUserSchema, ErrorSchema } from '../components'
import { store } from '../store'

export const usersHandler = new Hono()
  .get(
    '/users',
    describeRoute({
      operationId: 'listUsers',
      summary: 'List users',
      responses: {
        '200': {
          description: 'The users',
          content: { 'application/json': { schema: resolver(z.array(UserSchema)) } },
        },
      },
    }),
    validator(
      'query',
      z.object({ limit: z.coerce.number().int().min(1).max(100).default(20).exactOptional() }),
    ),
    (c) => c.json(store.users().slice(0, c.req.valid('query').limit ?? 20), 200),
  )
  .post(
    '/users',
    describeRoute({
      operationId: 'createUser',
      summary: 'Create a user',
      responses: {
        '201': {
          description: 'Created',
          content: { 'application/json': { schema: resolver(UserSchema) } },
        },
      },
    }),
    validator('json', NewUserSchema),
    (c) => c.json(store.addUser(c.req.valid('json').name), 201),
  )
  .get(
    '/users/:userId',
    describeRoute({
      operationId: 'getUser',
      summary: 'Get a user',
      responses: {
        '200': {
          description: 'The user',
          content: { 'application/json': { schema: resolver(UserSchema) } },
        },
        '404': {
          description: 'Not found',
          content: { 'application/json': { schema: resolver(ErrorSchema) } },
        },
      },
    }),
    validator('param', z.object({ userId: z.coerce.number().int().min(1) })),
    (c) => {
      const user = store.user(c.req.valid('param').userId)
      return user ? c.json(user, 200) : c.json({ message: 'user not found' }, 404)
    },
  )
