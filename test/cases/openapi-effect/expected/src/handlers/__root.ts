import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import { Schema } from 'effect'

export const rootHandler = new Hono().get(
  '/',
  describeRoute({
    operationId: 'health',
    summary: 'Health',
    responses: {
      '200': {
        description: 'OK',
        content: {
          'application/json': {
            schema: resolver(
              Schema.toStandardSchemaV1(Schema.Struct({ status: Schema.Literal('ok') })),
            ),
          },
        },
      },
    },
  }),
  (c) => {},
)
