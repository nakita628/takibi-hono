import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'cookieOptional', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    type('object')
      .pipe(
        (data) =>
          typeof data === 'object' && data !== null && !Array.isArray(data)
            ? Object.assign(Object.create(null), data)
            : data,
        type({
          'int_opt?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          'int64_opt?': type('string')
            .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
            .narrow(
              (data, ctx) =>
                (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
                ctx.mustBe('an int64'),
            ),
          'bool_opt?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe(
            (data) => /^(?:true|1|yes|on|y|enabled)$/i.test(data),
          ),
          'str_opt?': 'string',
          'ienum?': type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isFinite(value) ? value : ctx.error('a number')
            })
            .to('1 | 2 | 3'),
          'benum?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i)
            .pipe((data) => /^(?:true|1|yes|on|y|enabled)$/i.test(data))
            .to('true'),
          'iconst?': type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isFinite(value) ? value : ctx.error('a number')
            })
            .to('7'),
          'senum?': "'asc' | 'desc'",
          'ioneof?': type('unknown').pipe((data, ctx) => {
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
          'range?': type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            })
            .to('number.integer >= 1 & number.integer <= 100'),
          'length?': type('string')
            .narrow((data, ctx) => [...data].length >= 2 || ctx.mustBe('at least 2 characters'))
            .narrow((data, ctx) => [...data].length <= 4 || ctx.mustBe('at most 4 characters')),
          'pattern?': type('string').and(/^[a-z]+-\d{1,3}$/),
          'ref_int?': type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            })
            .to('number.integer >= 0'),
          'prefs?': type({
            'theme?': 'string',
            'size?': type('string').pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            }),
          }),
          'obj?': type({
            'a?': type('string').pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            }),
            'b?': 'string',
          }),
          'tx_lower?': type('string.lower'),
          'tx_email?': type('string.lower').to('string.email'),
          'session-id?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          'user.id?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          'Int_Opt?': 'string',
          'inull?': type('unknown').pipe(
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
