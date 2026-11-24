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
    v.object({
      page: v.pipe(
        v.optional(
          v.pipe(
            v.string(),
            v.regex(/^-?(?:0|[1-9]\d*)$/),
            v.metadata({ type: 'integer', minimum: 1 }),
            v.transform((input) => Number(input)),
            v.number(),
            v.safeInteger(),
            v.minValue(1),
          ),
          '1',
        ),
        v.metadata({ default: 1 }),
      ),
    }),
  ),
  (c) => {},
)
