import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { CountSchema, FieldsResponse } from '../components'

export const absentHandler = new Hono().get(
  '/absent',
  describeRoute({ operationId: 'queryAbsent', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'empty_ok?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
      'empty_def?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
      'empty_str?': 'string',
      'ref_def?': CountSchema,
    }),
  ),
  (c) => {},
)
