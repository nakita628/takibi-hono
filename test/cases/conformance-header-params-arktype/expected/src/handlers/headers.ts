import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { type } from 'arktype'
import { FieldsResponse } from '../components'

export const headersHandler = new Hono().get(
  '/headers',
  describeRoute({ operationId: 'headerParams', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    type({
      'x-integer?': 'number.integer',
      'x-int32?': 'number.integer >= -2147483648 & number.integer <= 2147483647',
      'x-int64?': type('bigint | number.integer')
        .or(/^-?\d+$/)
        .pipe((data) => BigInt(data))
        .narrow(
          (data, ctx) =>
            (data >= -9223372036854775808n && data <= 9223372036854775807n) ||
            ctx.mustBe('an int64'),
        ),
      'x-bigint?': 'bigint',
      'x-uint32?': 'number.integer >= 0 & number.integer <= 4294967295',
      'x-uint64?': type('bigint | number.integer')
        .or(/^-?\d+$/)
        .pipe((data) => BigInt(data))
        .narrow(
          (data, ctx) => (data >= 0n && data <= 18446744073709551615n) || ctx.mustBe('a uint64'),
        ),
      'x-number?': 'number',
      'x-float?': 'number >= -3.4028234663852886e38 & number <= 3.4028234663852886e38',
      'x-float32?': 'number >= -3.4028234663852886e38 & number <= 3.4028234663852886e38',
      'x-float64?': 'number',
      'x-double?': 'number',
      'x-numpassword?': 'number',
      'x-boolean?': 'boolean',
      'x-string?': 'string',
      'x-email?': 'string.email',
      'x-uuid?': 'string.uuid',
      'x-uuidv4?': 'string.uuid.v4',
      'x-uuidv7?': 'string.uuid.v7',
      'x-url?': 'string.url',
      'x-uri?': 'string.url',
      'x-httpurl?': type('string.url').and(/^https?:\/\//),
      'x-hostname?': type(
        /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
      ),
      'x-hex?': 'string.hex',
      'x-base64?': 'string.base64',
      'x-base64url?': 'string.base64.url',
      'x-nanoid?': type(/^[a-zA-Z0-9_-]{21}$/),
      'x-cuid2?': type(/^[0-9a-z]+$/),
      'x-ulid?': type(/^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/),
      'x-ipv4?': 'string.ip.v4',
      'x-ipv6?': 'string.ip.v6',
      'x-cidrv4?': type(
        /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
      ),
      'x-cidrv6?': type(
        /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
      ),
      'x-date?': type(
        /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$/,
      ),
      'x-time?': type(
        /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
      ),
      'x-datetime?': type(
        /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
      ),
      'x-duration?': type(
        /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
      ),
      'x-byte?': 'string',
      'x-strpassword?': 'string',
      'x-mac?': type(/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/),
      'x-e164?': type(/^\+[1-9]\d{6,14}$/),
      'x-creditcard?': 'string.creditCard',
      'x-iban?': 'string',
      'x-currencycode?': 'string',
      'x-ksuid?': type(/^[A-Za-z0-9]{27}$/),
      'x-xid?': type(/^[0-9a-vA-V]{20}$/),
      'x-guid?': type(
        /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
      ),
      'x-ids?': 'number.integer[]',
    }),
  ),
  (c) => {},
)
