import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const sharedHandler = new Hono().get(
  '/shared',
  describeRoute({ operationId: 'queryShared', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'filter?': type({
        'name?': 'string',
        'age?': type('string').pipe((data, ctx) => {
          const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
      }),
      'sort?': type({ 'name?': 'string', 'dir?': "'asc' | 'desc'" }),
    }),
  ),
  (c) => {},
)
