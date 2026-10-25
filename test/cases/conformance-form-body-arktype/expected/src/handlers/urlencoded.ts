import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { CountSchema, FlagSchema, FieldsResponse } from '../components'

export const urlencodedHandler = new Hono().post(
  '/urlencoded',
  describeRoute({ operationId: 'urlencoded', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    type('object')
      .pipe(
        (data) =>
          typeof data === 'object' && data !== null && !Array.isArray(data)
            ? Object.assign(Object.create(null), data)
            : data,
        type({
          'name?': 'string',
          'age?': type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            })
            .to('number.integer >= 0'),
          'ratio?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isFinite(value) ? value : ctx.error('a number')
          }),
          'big?': type('string')
            .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
            .narrow(
              (data, ctx) =>
                (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
                ctx.mustBe('an int64'),
            ),
          'active?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe((data) =>
            /^(?:true|1|yes|on|y|enabled)$/i.test(data),
          ),
          'level?': type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isFinite(value) ? value : ctx.error('a number')
            })
            .to('1 | 2'),
          'agreed?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i)
            .pipe((data) => /^(?:true|1|yes|on|y|enabled)$/i.test(data))
            .to('true'),
          'limit?': type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
          'count?': CountSchema,
          'flag?': FlagSchema,
          'tags?': type('unknown')
            .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
            .to('string[]'),
          'ids?': type('unknown').pipe(
            (data) => (data === undefined || Array.isArray(data) ? data : [data]),
            type(
              type('string').pipe((data, ctx) => {
                const value = Number(data)
                return Number.isSafeInteger(value) ? value : ctx.error('an integer')
              }),
            ).array(),
          ),
          'moment?': type(
            /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
          ),
          'clock?': type(
            /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
          ),
          'maybe?': type('unknown').pipe(
            (data) => (data === 'null' ? null : data),
            type(
              type('string').pipe((data, ctx) => {
                const value = Number(data)
                return Number.isSafeInteger(value) ? value : ctx.error('an integer')
              }),
            ).or('null'),
          ),
          'label?': 'string | null',
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
