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
        'age?': type('string')
          .pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          })
          .to('number.integer >= 0'),
        'active?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe((data) =>
          /^(?:true|1|yes|on|y|enabled)$/i.test(data),
        ),
        'ids?': type('unknown').pipe(
          (data) => (data === undefined || Array.isArray(data) ? data : [data]),
          type(
            type('string').pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            }),
          ).array(),
        ),
        'points?': type('unknown').pipe(
          (data) => (data === undefined || Array.isArray(data) ? data : [data]),
          type(
            type({
              'x?': type('string').pipe((data, ctx) => {
                const value = Number(data)
                return Number.isSafeInteger(value) ? value : ctx.error('an integer')
              }),
              'y?': type('string').pipe((data, ctx) => {
                const value = Number(data)
                return Number.isSafeInteger(value) ? value : ctx.error('an integer')
              }),
            }),
          ).array(),
        ),
        'tags?': type('unknown')
          .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
          .to('string[]'),
        'range?': type({
          'min?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          'max?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
        }),
      }),
      'deep_ref?': RangeSchema,
      'spread?': type({
        'sort?': "'asc' | 'desc'",
        'size?': type('string').pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
        'page?': type('string').pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
      }),
      'pairs?': type({
        'name?': 'string',
        'age?': type('string').pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
      }),
      'page?': 'string',
      'limit?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
    }),
  ),
  (c) => {},
)
