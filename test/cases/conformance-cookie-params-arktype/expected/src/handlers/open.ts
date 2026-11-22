import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const openHandler = new Hono().get(
  '/open',
  describeRoute({ operationId: 'cookieOpen', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    type({
      'page?': type('string').pipe((data, ctx) => {
        const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
      'bag?': type({ 'known?': 'string' }).narrow((data) =>
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
