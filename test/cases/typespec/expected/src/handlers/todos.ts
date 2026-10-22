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
            v.picklist(['true', 'false']),
            v.transform((input) => input === 'true'),
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
      v.object({ id: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()) }),
    ),
    (c) => {},
  )
