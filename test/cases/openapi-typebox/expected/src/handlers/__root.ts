import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import { Type } from 'typebox'
import { Compile } from 'typebox/compile'

export const rootHandler = new Hono().get(
  '/',
  describeRoute({
    operationId: 'health',
    summary: 'Health',
    responses: {
      '200': {
        description: 'OK',
        content: {
          'application/json': {
            schema: resolver(Compile(Type.Object({ status: Type.Literal('ok') }))),
          },
        },
      },
    },
  }),
  (c) => {},
)
