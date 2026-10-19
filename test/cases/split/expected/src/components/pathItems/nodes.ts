import { resolver } from 'hono-openapi'
import * as z from 'zod'
import { NodeSchema } from '@/components/schemas'

export const NodesPathItem = {
  get: {
    operationId: 'listNodes',
    parameters: [{ $ref: '#/components/parameters/Page' }],
    responses: {
      '200': {
        description: 'The nodes',
        content: { 'application/json': { schema: resolver(z.array(NodeSchema)) } },
      },
    },
  },
} as const
