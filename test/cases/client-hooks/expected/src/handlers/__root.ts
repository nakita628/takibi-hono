import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import * as z from 'zod'

export const rootHandler = new Hono().get(
  '/',
  describeRoute({
    operationId: 'health',
    summary: 'Health',
    responses: {
      '200': {
        description: 'OK',
        content: {
          'application/json': { schema: resolver(z.object({ status: z.literal('ok') })) },
        },
      },
    },
  }),
  (c) => {},
)
