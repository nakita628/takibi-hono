import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import * as v from 'valibot'

export const honoHandler = new Hono().get(
  '/hono',
  describeRoute({
    operationId: 'Hono_welcome',
    summary: 'Welcome',
    description: 'Returns a welcome message from Takibi Hono.',
    responses: {
      '200': {
        description: 'The request has succeeded.',
        content: { 'application/json': { schema: resolver(v.object({ message: v.string() })) } },
      },
    },
  }),
  (c) => {},
)
