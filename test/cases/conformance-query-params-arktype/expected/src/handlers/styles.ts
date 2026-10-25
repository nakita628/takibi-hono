import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const stylesHandler = new Hono().get(
  '/styles',
  describeRoute({ operationId: 'queryStyles', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'csv?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
        ).array(),
      ),
      'pipes?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
        ).array(),
      ),
      'spaces?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
        ).array(),
      ),
      'filter?': type({
        'name?': 'string',
        'age?': type('string').pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
      }),
      'csv_str?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string[]'),
    }),
  ),
  (c) => {},
)
