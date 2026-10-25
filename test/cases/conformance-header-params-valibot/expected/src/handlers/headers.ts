import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const headersHandler = new Hono().get(
  '/headers',
  describeRoute({ operationId: 'headerParams', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    v.partial(
      v.object({
        'x-integer': v.pipe(v.number(), v.integer()),
        'x-int32': v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647)),
        'x-int64': v.pipe(
          v.union([
            v.bigint(),
            v.pipe(v.number(), v.integer()),
            v.pipe(v.string(), v.regex(/^-?\d+$/)),
          ]),
          v.transform((input) => BigInt(input)),
          v.minValue(-9223372036854775808n),
          v.maxValue(9223372036854775807n),
        ),
        'x-bigint': v.bigint(),
        'x-uint32': v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295)),
        'x-uint64': v.pipe(
          v.union([
            v.bigint(),
            v.pipe(v.number(), v.integer()),
            v.pipe(v.string(), v.regex(/^-?\d+$/)),
          ]),
          v.transform((input) => BigInt(input)),
          v.minValue(0n),
          v.maxValue(18446744073709551615n),
        ),
        'x-number': v.number(),
        'x-float': v.pipe(
          v.number(),
          v.minValue(-3.4028234663852886e38),
          v.maxValue(3.4028234663852886e38),
        ),
        'x-float32': v.pipe(
          v.number(),
          v.minValue(-3.4028234663852886e38),
          v.maxValue(3.4028234663852886e38),
        ),
        'x-float64': v.number(),
        'x-double': v.number(),
        'x-numpassword': v.number(),
        'x-boolean': v.boolean(),
        'x-string': v.string(),
        'x-email': v.pipe(v.string(), v.email()),
        'x-uuid': v.pipe(
          v.string(),
          v.regex(
            /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
          ),
        ),
        'x-uuidv4': v.pipe(
          v.string(),
          v.regex(
            /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/,
          ),
        ),
        'x-uuidv7': v.pipe(
          v.string(),
          v.regex(
            /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-7[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/,
          ),
        ),
        'x-url': v.pipe(v.string(), v.url()),
        'x-uri': v.pipe(v.string(), v.url()),
        'x-httpurl': v.pipe(v.string(), v.url(), v.regex(/^https?:\/\//)),
        'x-hostname': v.pipe(
          v.string(),
          v.regex(
            /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
          ),
        ),
        'x-hex': v.pipe(v.string(), v.hexadecimal()),
        'x-base64': v.pipe(v.string(), v.base64()),
        'x-base64url': v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]*$/)),
        'x-nanoid': v.pipe(v.string(), v.nanoid()),
        'x-cuid2': v.pipe(v.string(), v.cuid2()),
        'x-ulid': v.pipe(v.string(), v.ulid()),
        'x-ipv4': v.pipe(v.string(), v.ipv4()),
        'x-ipv6': v.pipe(v.string(), v.ipv6()),
        'x-cidrv4': v.pipe(
          v.string(),
          v.regex(
            /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
          ),
        ),
        'x-cidrv6': v.pipe(
          v.string(),
          v.regex(
            /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
          ),
        ),
        'x-date': v.pipe(
          v.string(),
          v.regex(
            /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$/,
          ),
        ),
        'x-time': v.pipe(
          v.string(),
          v.regex(
            /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
          ),
        ),
        'x-datetime': v.pipe(
          v.string(),
          v.regex(
            /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
          ),
        ),
        'x-duration': v.pipe(
          v.string(),
          v.regex(
            /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
          ),
        ),
        'x-byte': v.string(),
        'x-strpassword': v.string(),
        'x-mac': v.pipe(v.string(), v.mac()),
        'x-e164': v.pipe(v.string(), v.regex(/^\+[1-9]\d{6,14}$/)),
        'x-creditcard': v.pipe(v.string(), v.creditCard()),
        'x-iban': v.string(),
        'x-currencycode': v.string(),
        'x-ksuid': v.pipe(v.string(), v.regex(/^[A-Za-z0-9]{27}$/)),
        'x-xid': v.pipe(v.string(), v.regex(/^[0-9a-vA-V]{20}$/)),
        'x-guid': v.pipe(
          v.string(),
          v.regex(
            /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
          ),
        ),
        'x-ids': v.array(v.pipe(v.number(), v.integer())),
      }),
    ),
  ),
  (c) => {},
)
