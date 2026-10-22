import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import { type } from 'arktype'

export const _202401Handler = new Hono().get(
  '/2024-01/reports',
  describeRoute({
    operationId: 'listReports',
    responses: {
      '200': {
        description: 'OK',
        content: { 'application/json': { schema: resolver(type('string[]')) } },
      },
    },
  }),
  (c) => {},
)
