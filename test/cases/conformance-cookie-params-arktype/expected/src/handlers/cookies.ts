import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const cookiesHandler = new Hono().get(
  '/cookies',
  describeRoute({ operationId: 'cookieParams', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    type({
      'integer?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
      'int32?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('number.integer >= -2147483648 & number.integer <= 2147483647'),
      'int64?': type('string')
        .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
        .narrow(
          (data, ctx) =>
            (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
            ctx.mustBe('an int64'),
        ),
      'bigint?': type('string').pipe((data, ctx) =>
        /^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer'),
      ),
      'uint32?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('number.integer >= 0 & number.integer <= 4294967295'),
      'uint64?': type('string')
        .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
        .narrow(
          (data, ctx) => (data >= 0n && data <= 18446744073709551615n) || ctx.mustBe('a uint64'),
        ),
      'number?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isFinite(value) ? value : ctx.error('a number')
      }),
      'float?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isFinite(value) ? value : ctx.error('a number')
        })
        .to('number >= -3.4028234663852886e38 & number <= 3.4028234663852886e38'),
      'float32?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isFinite(value) ? value : ctx.error('a number')
        })
        .to('number >= -3.4028234663852886e38 & number <= 3.4028234663852886e38'),
      'float64?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isFinite(value) ? value : ctx.error('a number')
      }),
      'double?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isFinite(value) ? value : ctx.error('a number')
      }),
      'numpassword?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isFinite(value) ? value : ctx.error('a number')
      }),
      'boolean?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe((data) =>
        /^(?:true|1|yes|on|y|enabled)$/i.test(data),
      ),
      'string?': 'string',
      'email?': 'string.email',
      'uuid?': 'string.uuid',
      'uuidv4?': 'string.uuid.v4',
      'uuidv7?': 'string.uuid.v7',
      'url?': 'string.url',
      'uri?': 'string.url',
      'httpurl?': type('string.url').and(/^https?:\/\//),
      'hostname?': type(
        /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
      ),
      'hex?': 'string.hex',
      'emoji?': type(/^[\p{Extended_Pictographic}\p{Emoji_Component}]+$/u),
      'base64?': 'string.base64',
      'base64url?': 'string.base64.url',
      'nanoid?': type(/^[a-zA-Z0-9_-]{21}$/),
      'cuid2?': type(/^[0-9a-z]+$/),
      'ulid?': type(/^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/),
      'ipv4?': 'string.ip.v4',
      'ipv6?': 'string.ip.v6',
      'cidrv4?': type(
        /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
      ),
      'cidrv6?': type(
        /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
      ),
      'date?': type(
        /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$/,
      ),
      'time?': type(
        /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
      ),
      'datetime?': type(
        /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
      ),
      'duration?': type(
        /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
      ),
      'byte?': 'string',
      'strpassword?': 'string',
      'mac?': type(/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/),
      'e164?': type(/^\+[1-9]\d{6,14}$/),
      'creditcard?': 'string.creditCard',
      'iban?': 'string',
      'currencycode?': 'string',
      'ksuid?': type(/^[A-Za-z0-9]{27}$/),
      'xid?': type(/^[0-9a-vA-V]{20}$/),
      'guid?': type(
        /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
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
    }),
  ),
  (c) => {},
)
