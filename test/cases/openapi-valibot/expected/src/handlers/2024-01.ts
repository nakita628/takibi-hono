import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import * as v from 'valibot'

export const _202401Handler = new Hono().get(
  '/2024-01/reports',
  describeRoute({
    operationId: 'listReports',
    responses: {
      '200': {
        description: 'OK',
        content: { 'application/json': { schema: resolver(v.array(v.string())) } },
      },
    },
  }),
  (c) => {},
)
