import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const literalsHandler = new Hono().get(
  '/literals',
  describeRoute({ operationId: 'queryLiterals', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'ienum?': type('string')
        .pipe((data, ctx) => {
          const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('1 | 2 | 3'),
      'nenum?': type('string')
        .pipe((data, ctx) => {
          const value = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(data)
            ? Number(data)
            : Number.NaN
          return Number.isFinite(value) ? value : ctx.error('a number')
        })
        .to('1.5 | 2.5'),
      'benum?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i)
        .pipe((data) => /^(?:true|1|yes|on|y|enabled)$/i.test(data))
        .to('true'),
      'iconst?': type('string')
        .pipe((data, ctx) => {
          const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('7'),
      'senum?': "'asc' | 'desc'",
      'sconst?': "'fixed'",
      'numericsenum?': "'1' | '02' | 'true'",
      'inull?': type('unknown').pipe(
        (data) => (data === 'null' ? null : data),
        type(
          type('string').pipe((data, ctx) => {
            const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
        ).or('null'),
      ),
      'bnull?': type('unknown').pipe(
        (data) => (data === 'null' ? null : data),
        type(
          type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe((data) =>
            /^(?:true|1|yes|on|y|enabled)$/i.test(data),
          ),
        ).or('null'),
      ),
      'nullof?': type('unknown').pipe(
        (data) => (data === 'null' ? null : data),
        type(
          type('unknown').pipe((data, ctx) => {
            for (const branch of [
              type('string').pipe((data, ctx) => {
                const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
                return Number.isSafeInteger(value) ? value : ctx.error('an integer')
              }),
              type('unknown')
                .pipe((data) => (data === 'null' ? null : data))
                .to('null'),
            ]) {
              const out = branch(data)
              if (!(out instanceof type.errors)) return out
            }
            return ctx.error('one of the members')
          }),
        ).or('null'),
      ),
      'inull_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('unknown').pipe(
            (data) => (data === 'null' ? null : data),
            type(
              type('string').pipe((data, ctx) => {
                const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
                return Number.isSafeInteger(value) ? value : ctx.error('an integer')
              }),
            ).or('null'),
          ),
        ).array(),
      ),
      'inull_list?': type('unknown').pipe(
        (data) => (data === 'null' ? null : data),
        type(
          type('unknown').pipe(
            (data) => (data === undefined || Array.isArray(data) ? data : [data]),
            type(
              type('string').pipe((data, ctx) => {
                const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
                return Number.isSafeInteger(value) ? value : ctx.error('an integer')
              }),
            ).array(),
          ),
        ).or('null'),
      ),
      'snull?': 'string | null',
      'ioneof?': type('unknown').pipe((data, ctx) => {
        for (const branch of [
          type('string').pipe((data, ctx) => {
            const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          type("'all'"),
        ]) {
          const out = branch(data)
          if (!(out instanceof type.errors)) return out
        }
        return ctx.error('one of the members')
      }),
      'ienum_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string')
            .pipe((data, ctx) => {
              const value = /^-?(?:0|[1-9]\d*)$/.test(data) ? Number(data) : Number.NaN
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            })
            .to('1 | 2 | 3'),
        ).array(),
      ),
      'senum_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to("'asc' | 'desc'[]"),
    }),
  ),
  (c) => {},
)
