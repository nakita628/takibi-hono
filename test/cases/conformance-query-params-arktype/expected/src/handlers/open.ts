import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const openHandler = new Hono().get(
  '/open',
  describeRoute({ operationId: 'queryOpen', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'page?': type('string').pipe((data, ctx) => {
        const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
      'extra?': type({ 'known?': 'string' }).narrow((data) =>
        Object.entries(data).every(
          ([key, value]) =>
            ['known'].includes(key) ||
            type('string')
              .pipe((data, ctx) => {
                const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
                return Number.isSafeInteger(value) ? value : ctx.error('an integer')
              })
              .allows(value),
        ),
      ),
    }),
  ),
  (c) => {},
)
