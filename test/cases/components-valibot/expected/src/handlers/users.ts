import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { UserSchema, UserFoundResponse, NotFoundResponse } from '../components'

export const usersHandler = new Hono()
  .get(
    '/users/:userId',
    describeRoute({
      operationId: 'getUser',
      responses: { '200': UserFoundResponse, '404': NotFoundResponse },
    }),
    validator('param', v.object({ userId: v.pipe(v.string(), v.uuid()) })),
    (c) => {},
  )
  .put(
    '/users/:userId',
    describeRoute({ operationId: 'replaceUser', responses: { '200': UserFoundResponse } }),
    validator('param', v.object({ userId: v.pipe(v.string(), v.uuid()) })),
    validator('json', UserSchema),
    (c) => {},
  )
