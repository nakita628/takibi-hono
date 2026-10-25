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
    validator(
      'param',
      v.object({
        userId: v.pipe(
          v.string(),
          v.regex(
            /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
          ),
        ),
      }),
    ),
    (c) => {},
  )
  .put(
    '/users/:userId',
    describeRoute({ operationId: 'replaceUser', responses: { '200': UserFoundResponse } }),
    validator(
      'param',
      v.object({
        userId: v.pipe(
          v.string(),
          v.regex(
            /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
          ),
        ),
      }),
    ),
    validator('json', UserSchema),
    (c) => {},
  )
