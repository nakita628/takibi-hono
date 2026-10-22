import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import { type } from 'arktype'

export const rootHandler = new Hono().get(
  '/',
  describeRoute({
    operationId: 'health',
    summary: 'Health',
    responses: {
      '200': {
        description: 'OK',
        content: { 'application/json': { schema: resolver(type({ status: "'ok'" })) } },
      },
    },
  }),
  (c) => {},
)
