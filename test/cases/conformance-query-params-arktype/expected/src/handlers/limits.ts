import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const limitsHandler = new Hono().get(
  '/limits',
  describeRoute({ operationId: 'queryLimits', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'range?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('number.integer >= 1 & number.integer <= 100'),
      'exclusive?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isFinite(value) ? value : ctx.error('a number')
        })
        .to('number > 0 & number < 1'),
      'multiple?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('number.integer % 5'),
      'int64range?': type('string')
        .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
        .narrow(
          (data, ctx) =>
            (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
            ctx.mustBe('an int64'),
        )
        .narrow((data, ctx) => data >= 1n || ctx.mustBe('at least 1'))
        .narrow((data, ctx) => data <= 100n || ctx.mustBe('at most 100')),
      'length?': type('string')
        .narrow((data, ctx) => [...data].length >= 2 || ctx.mustBe('at least 2 characters'))
        .narrow((data, ctx) => [...data].length <= 4 || ctx.mustBe('at most 4 characters')),
      'pattern?': type('string').and(/^[a-z]+-\d{1,3}$/),
      'items?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type(
            type('string').pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            }),
          ).array(),
        ).and(type('2 <= unknown[] <= 3')),
      ),
      'unique?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
        )
          .array()
          .narrow((data: unknown[], ctx) => new Set(data).size === data.length),
      ),
      'ranged_items?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            })
            .to('number.integer >= 1 & number.integer <= 9'),
        ).array(),
      ),
    }),
  ),
  (c) => {},
)
