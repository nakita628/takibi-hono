import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { RangeSchema, FieldsResponse } from '../components'

export const objectsHandler = new Hono().get(
  '/objects',
  describeRoute({ operationId: 'queryObjects', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'deep?': type({
        'name?': 'string',
        'age?': type('string.integer.parse').to('number.integer >= 0'),
        'active?': type("'true' | 'false'").pipe((data) => data === 'true'),
        'ids?': 'string.integer.parse[]',
        'points?': type(
          type({ 'x?': 'string.integer.parse', 'y?': 'string.integer.parse' }),
        ).array(),
        'tags?': 'string[]',
        'range?': type({ 'min?': 'string.integer.parse', 'max?': 'string.integer.parse' }),
      }),
      'deep_ref?': RangeSchema,
      'spread?': type({
        'sort?': "'asc' | 'desc'",
        'size?': 'string.integer.parse',
        'page?': 'string.integer.parse',
      }),
      'pairs?': type({ 'name?': 'string', 'age?': 'string.integer.parse' }),
      'page?': 'string',
      'limit?': 'string.integer.parse',
    }),
  ),
  (c) => {},
)
