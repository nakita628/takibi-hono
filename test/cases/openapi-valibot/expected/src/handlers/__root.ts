import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import * as v from 'valibot'

export const rootHandler = new Hono().get(
  '/',
  describeRoute({
    operationId: 'health',
    summary: 'Health',
    responses: {
      '200': {
        description: 'OK',
        content: {
          'application/json': { schema: resolver(v.object({ status: v.literal('ok') })) },
        },
      },
    },
  }),
  (c) => {},
)
