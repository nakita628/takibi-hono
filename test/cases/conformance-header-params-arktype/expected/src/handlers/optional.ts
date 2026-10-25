import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { CountSchema, FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'headerOptional', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    type('object')
      .pipe(
        (data) =>
          typeof data === 'object' && data !== null && !Array.isArray(data)
            ? Object.assign(Object.create(null), data)
            : data,
        type({
          'x-int-opt?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          'x-int64-opt?': type('string')
            .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
            .narrow(
              (data, ctx) =>
                (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
                ctx.mustBe('an int64'),
            ),
          'x-bool-opt?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe(
            (data) => /^(?:true|1|yes|on|y|enabled)$/i.test(data),
          ),
          'x-str-opt?': 'string',
          'x-ienum?': type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isFinite(value) ? value : ctx.error('a number')
            })
            .to('1 | 2 | 3'),
          'x-benum?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i)
            .pipe((data) => /^(?:true|1|yes|on|y|enabled)$/i.test(data))
            .to('true'),
          'x-iconst?': type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isFinite(value) ? value : ctx.error('a number')
            })
            .to('7'),
          'x-senum?': "'asc' | 'desc'",
          'x-ioneof?': type('unknown').pipe((data, ctx) => {
            for (const branch of [
              type('string').pipe((data, ctx) => {
                const value = Number(data)
                return Number.isSafeInteger(value) ? value : ctx.error('an integer')
              }),
              type("'all'"),
            ]) {
              const out = branch(data)
              if (!(out instanceof type.errors)) return out
            }
            return ctx.error('one of the members')
          }),
          'x-range?': type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            })
            .to('number.integer >= 1 & number.integer <= 100'),
          'x-length?': type('string')
            .narrow((data, ctx) => [...data].length >= 2 || ctx.mustBe('at least 2 characters'))
            .narrow((data, ctx) => [...data].length <= 4 || ctx.mustBe('at most 4 characters')),
          'x-pattern?': type('string').and(/^[a-z]+-\d{1,3}$/),
          'x-tx-lower?': type('string.lower'),
          'x-tx-email?': type('string.lower').to('string.email'),
          'x-ref-int?': CountSchema,
          'x-str-arr?': type('unknown')
            .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
            .to('string[]'),
          'x-obj?': type({
            'a?': type('string').pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            }),
            'b?': 'string',
          }),
          'x-objx?': type({
            'a?': type('string').pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            }),
            'b?': 'string',
          }),
          'x-request-id?': 'string.uuid',
          'x-rate-limit?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          'accept-version?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          'x_underscore?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          'x-inull?': type('unknown').pipe(
            (data) => (data === 'null' ? null : data),
            type(
              type('string').pipe((data, ctx) => {
                const value = Number(data)
                return Number.isSafeInteger(value) ? value : ctx.error('an integer')
              }),
            ).or('null'),
          ),
          'constructor?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
        }),
      )
      .pipe((data) => ({ ...data })),
  ),
  (c) => {},
)
