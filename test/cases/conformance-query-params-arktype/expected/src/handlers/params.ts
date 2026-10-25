import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const paramsHandler = new Hono().get(
  '/params',
  describeRoute({ operationId: 'queryParams', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    type({
      'integer?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isSafeInteger(value) ? value : ctx.error('an integer')
      }),
      'integer_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isSafeInteger(value) ? value : ctx.error('an integer')
          }),
        ).array(),
      ),
      'int32?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('number.integer >= -2147483648 & number.integer <= 2147483647'),
      'int32_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            })
            .to('number.integer >= -2147483648 & number.integer <= 2147483647'),
        ).array(),
      ),
      'int64?': type('string')
        .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
        .narrow(
          (data, ctx) =>
            (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
            ctx.mustBe('an int64'),
        ),
      'int64_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string')
            .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
            .narrow(
              (data, ctx) =>
                (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
                ctx.mustBe('an int64'),
            ),
        ).array(),
      ),
      'bigint?': type('string').pipe((data, ctx) =>
        /^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer'),
      ),
      'bigint_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string').pipe((data, ctx) =>
            /^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer'),
          ),
        ).array(),
      ),
      'uint32?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isSafeInteger(value) ? value : ctx.error('an integer')
        })
        .to('number.integer >= 0 & number.integer <= 4294967295'),
      'uint32_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isSafeInteger(value) ? value : ctx.error('an integer')
            })
            .to('number.integer >= 0 & number.integer <= 4294967295'),
        ).array(),
      ),
      'uint64?': type('string')
        .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
        .narrow(
          (data, ctx) => (data >= 0n && data <= 18446744073709551615n) || ctx.mustBe('a uint64'),
        ),
      'uint64_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string')
            .pipe((data, ctx) => (/^-?\d+$/.test(data) ? BigInt(data) : ctx.error('an integer')))
            .narrow(
              (data, ctx) =>
                (data >= 0n && data <= 18446744073709551615n) || ctx.mustBe('a uint64'),
            ),
        ).array(),
      ),
      'number?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isFinite(value) ? value : ctx.error('a number')
      }),
      'number_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isFinite(value) ? value : ctx.error('a number')
          }),
        ).array(),
      ),
      'float?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isFinite(value) ? value : ctx.error('a number')
        })
        .to('number >= -3.4028234663852886e38 & number <= 3.4028234663852886e38'),
      'float_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isFinite(value) ? value : ctx.error('a number')
            })
            .to('number >= -3.4028234663852886e38 & number <= 3.4028234663852886e38'),
        ).array(),
      ),
      'float32?': type('string')
        .pipe((data, ctx) => {
          const value = Number(data)
          return Number.isFinite(value) ? value : ctx.error('a number')
        })
        .to('number >= -3.4028234663852886e38 & number <= 3.4028234663852886e38'),
      'float32_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string')
            .pipe((data, ctx) => {
              const value = Number(data)
              return Number.isFinite(value) ? value : ctx.error('a number')
            })
            .to('number >= -3.4028234663852886e38 & number <= 3.4028234663852886e38'),
        ).array(),
      ),
      'float64?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isFinite(value) ? value : ctx.error('a number')
      }),
      'float64_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isFinite(value) ? value : ctx.error('a number')
          }),
        ).array(),
      ),
      'double?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isFinite(value) ? value : ctx.error('a number')
      }),
      'double_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isFinite(value) ? value : ctx.error('a number')
          }),
        ).array(),
      ),
      'numpassword?': type('string').pipe((data, ctx) => {
        const value = Number(data)
        return Number.isFinite(value) ? value : ctx.error('a number')
      }),
      'numpassword_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type('string').pipe((data, ctx) => {
            const value = Number(data)
            return Number.isFinite(value) ? value : ctx.error('a number')
          }),
        ).array(),
      ),
      'boolean?': type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe((data) =>
        /^(?:true|1|yes|on|y|enabled)$/i.test(data),
      ),
      'boolean_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i).pipe((data) =>
            /^(?:true|1|yes|on|y|enabled)$/i.test(data),
          ),
        ).array(),
      ),
      'string?': 'string',
      'string_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string[]'),
      'email?': 'string.email',
      'email_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.email[]'),
      'uuid?': 'string.uuid',
      'uuid_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.uuid[]'),
      'uuidv4?': 'string.uuid.v4',
      'uuidv4_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.uuid.v4[]'),
      'uuidv7?': 'string.uuid.v7',
      'uuidv7_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.uuid.v7[]'),
      'url?': 'string.url',
      'url_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.url[]'),
      'uri?': 'string.url',
      'uri_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.url[]'),
      'httpurl?': type('string.url').and(/^https?:\/\//),
      'httpurl_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(type('string.url').and(/^https?:\/\//)).array(),
      ),
      'hostname?': type(
        /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
      ),
      'hostname_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type(
            /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
          ),
        ).array(),
      ),
      'hex?': 'string.hex',
      'hex_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.hex[]'),
      'emoji?': type(/^[\p{Extended_Pictographic}\p{Emoji_Component}]+$/u),
      'emoji_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(type(/^[\p{Extended_Pictographic}\p{Emoji_Component}]+$/u)).array(),
      ),
      'base64?': 'string.base64',
      'base64_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.base64[]'),
      'base64url?': 'string.base64.url',
      'base64url_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.base64.url[]'),
      'nanoid?': type(/^[a-zA-Z0-9_-]{21}$/),
      'nanoid_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(type(/^[a-zA-Z0-9_-]{21}$/)).array(),
      ),
      'cuid2?': type(/^[0-9a-z]+$/),
      'cuid2_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(type(/^[0-9a-z]+$/)).array(),
      ),
      'ulid?': type(/^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/),
      'ulid_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(type(/^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/)).array(),
      ),
      'ipv4?': 'string.ip.v4',
      'ipv4_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.ip.v4[]'),
      'ipv6?': 'string.ip.v6',
      'ipv6_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.ip.v6[]'),
      'cidrv4?': type(
        /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
      ),
      'cidrv4_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type(
            /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
          ),
        ).array(),
      ),
      'cidrv6?': type(
        /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
      ),
      'cidrv6_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type(
            /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
          ),
        ).array(),
      ),
      'date?': type(
        /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$/,
      ),
      'date_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type(
            /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$/,
          ),
        ).array(),
      ),
      'time?': type(
        /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
      ),
      'time_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type(
            /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
          ),
        ).array(),
      ),
      'datetime?': type(
        /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
      ),
      'datetime_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type(
            /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
          ),
        ).array(),
      ),
      'duration?': type(
        /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
      ),
      'duration_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type(
            /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
          ),
        ).array(),
      ),
      'byte?': 'string',
      'byte_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string[]'),
      'strpassword?': 'string',
      'strpassword_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string[]'),
      'mac?': type(/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/),
      'mac_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(type(/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/)).array(),
      ),
      'e164?': type(/^\+[1-9]\d{6,14}$/),
      'e164_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(type(/^\+[1-9]\d{6,14}$/)).array(),
      ),
      'creditcard?': 'string.creditCard',
      'creditcard_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string.creditCard[]'),
      'iban?': 'string',
      'iban_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string[]'),
      'currencycode?': 'string',
      'currencycode_arr?': type('unknown')
        .pipe((data) => (data === undefined || Array.isArray(data) ? data : [data]))
        .to('string[]'),
      'ksuid?': type(/^[A-Za-z0-9]{27}$/),
      'ksuid_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(type(/^[A-Za-z0-9]{27}$/)).array(),
      ),
      'xid?': type(/^[0-9a-vA-V]{20}$/),
      'xid_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(type(/^[0-9a-vA-V]{20}$/)).array(),
      ),
      'guid?': type(
        /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
      ),
      'guid_arr?': type('unknown').pipe(
        (data) => (data === undefined || Array.isArray(data) ? data : [data]),
        type(
          type(/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/),
        ).array(),
      ),
      'tx_trim?': type('string.trim'),
      'tx_lower?': type('string.lower'),
      'tx_upper?': type('string.upper'),
      'tx_normalize?': type('string.normalize.NFKC'),
      'tx_email_trim?': type('string.trim').to('string.email'),
      'tx_uuid_trim?': type('string.trim').to('string.uuid'),
      'tx_email_lower?': type('string.lower').to('string.email'),
    }),
  ),
  (c) => {},
)
