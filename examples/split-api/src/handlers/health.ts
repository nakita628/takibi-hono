import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import * as z from 'zod'

export const healthHandler = new Hono().get(
  '/health',
  describeRoute({
    operationId: 'getHealth',
    summary: 'Health check',
    responses: {
      '200': {
        description: 'The service is up',
        content: {
          'application/json': { schema: resolver(z.object({ status: z.literal('ok') })) },
        },
      },
    },
  }),
  (c) => c.json({ status: 'ok' } as const, 200),
)
