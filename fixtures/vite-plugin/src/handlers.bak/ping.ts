import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'

export const pingHandler = new Hono().get(
  '/ping',
  describeRoute({
    summary: 'Ping',
    operationId: 'ping',
    responses: { 200: { description: 'OK' } },
  }),
  (c) => {
    throw new Error('Not implemented')
  },
)
