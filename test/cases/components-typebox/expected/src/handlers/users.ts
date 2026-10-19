import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Type } from 'typebox'
import { Compile } from 'typebox/compile'
import { UserSchema, UserFoundResponse, NotFoundResponse } from '../components'

export const usersHandler = new Hono()
  .get(
    '/users/:userId',
    describeRoute({
      operationId: 'getUser',
      responses: { '200': UserFoundResponse, '404': NotFoundResponse },
    }),
    validator('param', Compile(Type.Object({ userId: Type.String({ format: 'uuid' }) }))),
    (c) => {},
  )
  .put(
    '/users/:userId',
    describeRoute({ operationId: 'replaceUser', responses: { '200': UserFoundResponse } }),
    validator('param', Compile(Type.Object({ userId: Type.String({ format: 'uuid' }) }))),
    validator('json', Compile(UserSchema)),
    (c) => {},
  )
