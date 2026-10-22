import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { UserSchema, UserFoundResponse, NotFoundResponse } from '../components'

export const usersHandler = new Hono()
  .get(
    '/users/:userId',
    describeRoute({
      operationId: 'getUser',
      responses: { '200': UserFoundResponse, '404': NotFoundResponse },
    }),
    validator('param', type({ userId: 'string.uuid' })),
    (c) => {},
  )
  .put(
    '/users/:userId',
    describeRoute({ operationId: 'replaceUser', responses: { '200': UserFoundResponse } }),
    validator('param', type({ userId: 'string.uuid' })),
    validator('json', UserSchema),
    (c) => {},
  )
