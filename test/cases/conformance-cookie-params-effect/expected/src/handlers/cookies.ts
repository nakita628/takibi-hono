import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const cookiesHandler = new Hono().get(
  '/cookies',
  describeRoute({ operationId: 'cookieParams', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        integer: Schema.optional(Schema.FiniteFromString.check(Schema.isInt())),
        int32: Schema.optional(Schema.FiniteFromString.check(Schema.isInt32())),
        int64: Schema.optional(
          Schema.BigIntFromString.check(
            Schema.isBetweenBigInt({
              minimum: -9223372036854775808n,
              maximum: 9223372036854775807n,
            }),
          ),
        ),
        bigint: Schema.optional(Schema.BigIntFromString),
        uint32: Schema.optional(Schema.FiniteFromString.check(Schema.isUint32())),
        uint64: Schema.optional(
          Schema.BigIntFromString.check(
            Schema.isBetweenBigInt({ minimum: 0n, maximum: 18446744073709551615n }),
          ),
        ),
        number: Schema.optional(Schema.FiniteFromString),
        float: Schema.optional(
          Schema.FiniteFromString.check(
            Schema.isBetween({ minimum: -3.4028234663852886e38, maximum: 3.4028234663852886e38 }),
          ),
        ),
        float32: Schema.optional(
          Schema.FiniteFromString.check(
            Schema.isBetween({ minimum: -3.4028234663852886e38, maximum: 3.4028234663852886e38 }),
          ),
        ),
        float64: Schema.optional(Schema.FiniteFromString),
        double: Schema.optional(Schema.FiniteFromString),
        numpassword: Schema.optional(Schema.FiniteFromString),
        boolean: Schema.optional(
          Schema.String.check(
            Schema.isPattern(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
          ).pipe(
            Schema.decodeTo(
              Schema.Boolean,
              SchemaTransformation.transform({
                decode: (input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input),
                encode: (output) => (output ? 'true' : 'false'),
              }),
            ),
          ),
        ),
        string: Schema.optional(Schema.String),
        email: Schema.optional(
          Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
        ),
        uuid: Schema.optional(Schema.String.check(Schema.isUUID())),
        uuidv4: Schema.optional(Schema.String.check(Schema.isUUID(4))),
        uuidv7: Schema.optional(Schema.String.check(Schema.isUUID(7))),
        url: Schema.optional(
          Schema.String.check(Schema.makeFilter((input) => URL.canParse(input))),
        ),
        uri: Schema.optional(
          Schema.String.check(Schema.makeFilter((input) => URL.canParse(input))),
        ),
        httpurl: Schema.optional(
          Schema.String.check(
            Schema.makeFilter((input) => URL.canParse(input) && /^https?:\/\//.test(input)),
          ),
        ),
        hostname: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
            ),
          ),
        ),
        hex: Schema.optional(Schema.String.check(Schema.isPattern(/^[0-9a-fA-F]*$/))),
        emoji: Schema.optional(
          Schema.String.check(
            Schema.isPattern(/^[\p{Extended_Pictographic}\p{Emoji_Component}]+$/u),
          ),
        ),
        base64: Schema.optional(Schema.String.check(Schema.isBase64())),
        base64url: Schema.optional(Schema.String.check(Schema.isBase64Url())),
        nanoid: Schema.optional(Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9_-]{21}$/))),
        cuid2: Schema.optional(Schema.String.check(Schema.isPattern(/^[0-9a-z]+$/))),
        ulid: Schema.optional(Schema.String.check(Schema.isULID())),
        ipv4: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
            ),
          ),
        ),
        ipv6: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,
            ),
          ),
        ),
        cidrv4: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
            ),
          ),
        ),
        cidrv6: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
            ),
          ),
        ),
        date: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$/,
            ),
          ),
        ),
        time: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
            ),
          ),
        ),
        datetime: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
            ),
          ),
        ),
        duration: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
            ),
          ),
        ),
        byte: Schema.optional(Schema.String),
        strpassword: Schema.optional(Schema.String),
        mac: Schema.optional(
          Schema.String.check(
            Schema.isPattern(/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/),
          ),
        ),
        e164: Schema.optional(Schema.String.check(Schema.isPattern(/^\+[1-9]\d{6,14}$/))),
        creditcard: Schema.optional(Schema.String),
        iban: Schema.optional(Schema.String),
        currencycode: Schema.optional(Schema.String),
        ksuid: Schema.optional(Schema.String.check(Schema.isPattern(/^[A-Za-z0-9]{27}$/))),
        xid: Schema.optional(Schema.String.check(Schema.isPattern(/^[0-9a-vA-V]{20}$/))),
        guid: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
            ),
          ),
        ),
        ids: Schema.optional(
          Schema.Unknown.pipe(
            Schema.decodeTo(
              Schema.Unknown,
              SchemaTransformation.transform<unknown, unknown>({
                decode: (input) => (input === undefined || Array.isArray(input) ? input : [input]),
                encode: (output) => output,
              }),
            ),
            Schema.decodeTo(Schema.Array(Schema.FiniteFromString.check(Schema.isInt()))),
          ),
        ),
      }),
    ),
  ),
  (c) => {},
)
