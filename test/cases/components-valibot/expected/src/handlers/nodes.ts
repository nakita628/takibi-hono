import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as v from 'valibot'
import { NodeSchema } from '../components'

export const nodesHandler = new Hono().get(
  '/nodes',
  describeRoute({
    operationId: 'listNodes',
    responses: {
      '200': {
        description: 'The nodes',
        content: { 'application/json': { schema: resolver(v.array(NodeSchema)) } },
      },
    },
  }),
  validator(
    'query',
    v.partial(
      v.object({
        page: v.optional(
          v.pipe(v.string(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
          '1',
        ),
      }),
    ),
  ),
  (c) => {},
)
