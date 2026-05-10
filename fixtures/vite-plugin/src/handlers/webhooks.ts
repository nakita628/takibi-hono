import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { UserSchema } from '../schemas'

export const webhooksHandler = new Hono()
  .post(
    '/newOrder',
    describeRoute({
      summary: 'New order webhook',
      tags: ['Webhooks'],
      operationId: 'onNewOrder',
      responses: { 200: { description: 'Acknowledged' } },
    }),
    validator('json', z.object({ orderId: z.string(), amount: z.number().optional() })),
    (c) => {
      throw new Error('Not implemented')
    },
  )
  .post(
    '/userCreated',
    describeRoute({
      summary: 'User created webhook',
      operationId: 'onUserCreated',
      responses: { 200: { description: 'Acknowledged' } },
    }),
    validator('json', UserSchema),
    (c) => {
      throw new Error('Not implemented')
    },
  )
