import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
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
      Schema.toStandardSchemaV1(Schema.Struct({ userId: Schema.String.check(Schema.isUUID()) })),
    ),
    (c) => {},
  )
  .put(
    '/users/:userId',
    describeRoute({ operationId: 'replaceUser', responses: { '200': UserFoundResponse } }),
    validator(
      'param',
      Schema.toStandardSchemaV1(Schema.Struct({ userId: Schema.String.check(Schema.isUUID()) })),
    ),
    validator('json', Schema.toStandardSchemaV1(UserSchema)),
    (c) => {},
  )
