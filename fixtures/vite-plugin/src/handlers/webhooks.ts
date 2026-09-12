import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { UserSchema } from '../schemas'

export const webhooksHandler = new Hono()
  .post(
    '/newOrder',
    describeRoute({
      operationId: 'onNewOrder',
      summary: 'New order webhook',
      tags: ['Webhooks'],
      responses: { '200': { description: 'Acknowledged' } },
    }),
    validator('json', z.object({ orderId: z.string(), amount: z.number().exactOptional() })),
    (c) => {},
  )
  .post(
    '/userCreated',
    describeRoute({
      operationId: 'onUserCreated',
      summary: 'User created webhook',
      responses: { '200': { description: 'Acknowledged' } },
    }),
    validator('json', UserSchema),
    (c) => {},
  )
