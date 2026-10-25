import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import { Schema } from 'effect'

export const _202401Handler = new Hono().get(
  '/2024-01/reports',
  describeRoute({
    operationId: 'listReports',
    responses: {
      '200': {
        description: 'OK',
        content: {
          'application/json': {
            schema: resolver(Schema.toStandardSchemaV1(Schema.Array(Schema.String))),
          },
        },
      },
    },
  }),
  (c) => {},
)
