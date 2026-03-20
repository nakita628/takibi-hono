import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import { Schema } from 'effect'
import { standardSchemaV1 } from 'effect/Schema'

export const honoHandler = new Hono().get(
  '/hono',
  describeRoute({
    tags: ['Hono'],
    operationId: 'Hono_list',
    responses: {
      200: {
        description: 'The request has succeeded.',
        content: {
          'application/json': {
            schema: resolver(
              standardSchemaV1(
                Schema.Union(
                  Schema.Array(
                    Schema.Struct({
                      hono: Schema.Union(
                        Schema.Literal('Hono'),
                        Schema.Literal('HonoX'),
                        Schema.Literal('ZodOpenAPIHono'),
                      ),
                    }),
                  ),
                  Schema.Struct({ code: Schema.Number, message: Schema.String }),
                ),
              ),
            ),
          },
        },
      },
    },
  }),
  (c) => c.json({ hono: 'Hono' }),
)
