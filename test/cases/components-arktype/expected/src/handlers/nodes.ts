import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { type } from 'arktype'
import { NodeSchema } from '../components'

export const nodesHandler = new Hono().get(
  '/nodes',
  describeRoute({
    operationId: 'listNodes',
    responses: {
      '200': {
        description: 'The nodes',
        content: { 'application/json': { schema: resolver(type(NodeSchema).array()) } },
      },
    },
  }),
  validator(
    'query',
    type({
      'page?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('number.integer >= 1'),
    }),
  ),
  (c) => {},
)
