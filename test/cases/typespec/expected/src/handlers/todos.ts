import { Hono } from 'hono'
import { describeRoute, resolver, validator } from 'hono-openapi'
import * as v from 'valibot'
import { TodoSchema } from '../components'

export const todosHandler = new Hono()
  .get(
    '/todos',
    describeRoute({
      operationId: 'Todos_list',
      responses: {
        '200': {
          description: 'The request has succeeded.',
          content: { 'application/json': { schema: resolver(v.array(TodoSchema)) } },
        },
      },
    }),
    validator(
      'query',
      v.partial(
        v.object({
          done: v.pipe(
            v.string(),
            v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
          ),
        }),
      ),
    ),
    (c) => {},
  )
  .post(
    '/todos',
    describeRoute({
      operationId: 'Todos_create',
      responses: {
        '200': {
          description: 'The request has succeeded.',
          content: { 'application/json': { schema: resolver(TodoSchema) } },
        },
      },
    }),
    validator('json', TodoSchema),
    (c) => {},
  )
  .get(
    '/todos/:id',
    describeRoute({
      operationId: 'Todos_read',
      responses: {
        '200': {
          description: 'The request has succeeded.',
          content: { 'application/json': { schema: resolver(TodoSchema) } },
        },
      },
    }),
    validator(
      'param',
      v.object({
        id: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.safeInteger(),
          v.minValue(-2147483648),
          v.maxValue(2147483647),
        ),
      }),
    ),
    (c) => {},
  )
