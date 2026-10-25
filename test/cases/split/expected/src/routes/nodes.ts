import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as z from 'zod'
import { NodeSchema } from '@/components/schemas'

export const nodesHandler = new Hono().get(
  '/nodes',
  describeRoute({
    operationId: 'listNodes',
    responses: {
      '200': {
        description: 'The nodes',
        content: { 'application/json': { schema: resolver(z.array(NodeSchema)) } },
      },
    },
  }),
  validator('query', z.object({ page: z.coerce.number().int().min(1).default(1).exactOptional() })),
  (c) => {},
)
