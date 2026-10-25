import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const combinatorsHandler = new Hono().get(
  '/combinators',
  describeRoute({ operationId: 'queryCombinators', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'allof?': type(
        type('string').pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        }),
      ).and(
        type('string')
          .pipe((data, ctx) => {
            const value = Number(data)
            return Number.isFinite(value) ? value : ctx.error('a number')
          })
          .to('number >= 5'),
      ),
      'allof_range?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('number.integer >= 1 & number.integer <= 10'),
      'oneof_is?': type('unknown').pipe((data, ctx) => {
        for (const branch of [
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          type('string'),
        ]) {
          const out = branch(data)
          if (!(out instanceof type.errors)) return out
        }
        return ctx.error('one of the members')
      }),
      'oneof_ib?': type('unknown').pipe((data, ctx) => {
        for (const branch of [
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe((data) =>
            /^(?:true|1|yes|on|y|enabled)$/i.test(data),
          ),
        ]) {
          const out = branch(data)
          if (!(out instanceof type.errors)) return out
        }
        return ctx.error('one of the members')
      }),
      'anyof_ns?': type('unknown').pipe((data, ctx) => {
        for (const branch of [
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isFinite(value) ? value : ctx.error('a number')
          }),
          type('string'),
        ]) {
          const out = branch(data)
          if (!(out instanceof type.errors)) return out
        }
        return ctx.error('one of the members')
      }),
      'mixed?': "1 | 'a' | '2'",
      'not_zero?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .narrow((data: unknown) => data !== 0),
      'not_enum?': type('unknown').narrow((data: unknown) => ![1, 2].includes(data as never)),
      'not_string?': type('unknown').narrow((data: unknown) => typeof data !== 'string'),
      'typeless_min?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isFinite(value) ? value : ctx.error('a number')
        })
        .to('number >= 1'),
      'typeless_len?': type('string').narrow(
        (data, ctx) => [...data].length >= 3 || ctx.mustBe('at least 3 characters'),
      ),
      'nconst?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isFinite(value) ? value : ctx.error('a number')
        })
        .to('2'),
      'multi?': type('unknown').pipe((data, ctx) => {
        for (const branch of [
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          type('string'),
        ]) {
          const out = branch(data)
          if (!(out instanceof type.errors)) return out
        }
        return ctx.error('one of the members')
      }),
      'multi_nb?': type('unknown').pipe((data, ctx) => {
        for (const branch of [
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isFinite(value) ? value : ctx.error('a number')
          }),
          type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe((data) =>
            /^(?:true|1|yes|on|y|enabled)$/i.test(data),
          ),
        ]) {
          const out = branch(data)
          if (!(out instanceof type.errors)) return out
        }
        return ctx.error('one of the members')
      }),
      'tuple?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type([
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          'string',
        ]),
      ),
    }),
  ),
  (c) => {},
)
