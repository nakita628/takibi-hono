import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { Type, Codec } from 'typebox'
import { Compile } from 'typebox/compile'
import { NodeSchema } from '../components'

export const nodesHandler = new Hono().get(
  '/nodes',
  describeRoute({
    operationId: 'listNodes',
    responses: {
      '200': {
        description: 'The nodes',
        content: { 'application/json': { schema: resolver(Compile(Type.Array(NodeSchema))) } },
      },
    },
  }),
  validator(
    'query',
    Compile(
      Type.Object({
        page: Type.Optional(
          Type.Optional(
            Codec(Type.String({ default: '1' }))
              .Decode((value) => Number.parseInt(value, 10))
              .Encode((value) => String(value)),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
