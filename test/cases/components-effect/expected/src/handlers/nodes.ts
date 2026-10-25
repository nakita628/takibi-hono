import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import { Effect, Schema } from 'effect'
import { NodeSchema } from '../components'

export const nodesHandler = new Hono().get(
  '/nodes',
  describeRoute({
    operationId: 'listNodes',
    responses: {
      '200': {
        description: 'The nodes',
        content: {
          'application/json': {
            schema: resolver(Schema.toStandardSchemaV1(Schema.Array(NodeSchema))),
          },
        },
      },
    },
  }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        page: Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)).pipe(
          Schema.withDecodingDefaultType(Effect.succeed(1)),
        ),
      }),
    ),
  ),
  (c) => {},
)
