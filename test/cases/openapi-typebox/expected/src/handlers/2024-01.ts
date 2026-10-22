import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import { Type } from 'typebox'
import { Compile } from 'typebox/compile'

export const _202401Handler = new Hono().get(
  '/2024-01/reports',
  describeRoute({
    operationId: 'listReports',
    responses: {
      '200': {
        description: 'OK',
        content: { 'application/json': { schema: resolver(Compile(Type.Array(Type.String()))) } },
      },
    },
  }),
  (c) => {},
)
