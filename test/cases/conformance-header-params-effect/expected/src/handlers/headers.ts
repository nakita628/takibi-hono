import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const headersHandler = new Hono().get(
  '/headers',
  describeRoute({ operationId: 'headerParams', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        'x-integer': Schema.optional(Schema.Number.check(Schema.isInt())),
        'x-int32': Schema.optional(Schema.Number.check(Schema.isInt32())),
        'x-int64': Schema.optional(
          Schema.Union([
            Schema.BigInt,
            Schema.Number.check(Schema.isInt()),
            Schema.String.check(Schema.isPattern(/^-?\d+$/)),
          ])
            .pipe(
              Schema.decodeTo(
                Schema.BigInt,
                SchemaTransformation.transform({
                  decode: (input) => BigInt(input),
                  encode: (output) => output,
                }),
              ),
            )
            .check(
              Schema.isBetweenBigInt({
                minimum: -9223372036854775808n,
                maximum: 9223372036854775807n,
              }),
            ),
        ),
        'x-bigint': Schema.optional(Schema.BigInt),
        'x-uint32': Schema.optional(Schema.Number.check(Schema.isUint32())),
        'x-uint64': Schema.optional(
          Schema.Union([
            Schema.BigInt,
            Schema.Number.check(Schema.isInt()),
            Schema.String.check(Schema.isPattern(/^-?\d+$/)),
          ])
            .pipe(
              Schema.decodeTo(
                Schema.BigInt,
                SchemaTransformation.transform({
                  decode: (input) => BigInt(input),
                  encode: (output) => output,
                }),
              ),
            )
            .check(Schema.isBetweenBigInt({ minimum: 0n, maximum: 18446744073709551615n })),
        ),
        'x-number': Schema.optional(Schema.Number),
        'x-float': Schema.optional(
          Schema.Number.check(
            Schema.isBetween({ minimum: -3.4028234663852886e38, maximum: 3.4028234663852886e38 }),
          ),
        ),
        'x-float32': Schema.optional(
          Schema.Number.check(
            Schema.isBetween({ minimum: -3.4028234663852886e38, maximum: 3.4028234663852886e38 }),
          ),
        ),
        'x-float64': Schema.optional(Schema.Number),
        'x-double': Schema.optional(Schema.Number),
        'x-numpassword': Schema.optional(Schema.Number),
        'x-boolean': Schema.optional(Schema.Boolean),
        'x-string': Schema.optional(Schema.String),
        'x-email': Schema.optional(
          Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
        ),
        'x-uuid': Schema.optional(Schema.String.check(Schema.isUUID())),
        'x-uuidv4': Schema.optional(Schema.String.check(Schema.isUUID(4))),
        'x-uuidv7': Schema.optional(Schema.String.check(Schema.isUUID(7))),
        'x-url': Schema.optional(
          Schema.String.check(Schema.makeFilter((input) => URL.canParse(input))),
        ),
        'x-uri': Schema.optional(
          Schema.String.check(Schema.makeFilter((input) => URL.canParse(input))),
        ),
        'x-httpurl': Schema.optional(
          Schema.String.check(
            Schema.makeFilter((input) => URL.canParse(input) && /^https?:\/\//.test(input)),
          ),
        ),
        'x-hostname': Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
            ),
          ),
        ),
        'x-hex': Schema.optional(Schema.String.check(Schema.isPattern(/^[0-9a-fA-F]*$/))),
        'x-base64': Schema.optional(Schema.String.check(Schema.isBase64())),
        'x-base64url': Schema.optional(Schema.String.check(Schema.isBase64Url())),
        'x-nanoid': Schema.optional(Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9_-]{21}$/))),
        'x-cuid2': Schema.optional(Schema.String.check(Schema.isPattern(/^[0-9a-z]+$/))),
        'x-ulid': Schema.optional(Schema.String.check(Schema.isULID())),
        'x-ipv4': Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
            ),
          ),
        ),
        'x-ipv6': Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,
            ),
          ),
        ),
        'x-cidrv4': Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
            ),
          ),
        ),
        'x-cidrv6': Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
            ),
          ),
        ),
        'x-date': Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$/,
            ),
          ),
        ),
        'x-time': Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
            ),
          ),
        ),
        'x-datetime': Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
            ),
          ),
        ),
        'x-duration': Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
            ),
          ),
        ),
        'x-byte': Schema.optional(Schema.String),
        'x-strpassword': Schema.optional(Schema.String),
        'x-mac': Schema.optional(
          Schema.String.check(
            Schema.isPattern(/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/),
          ),
        ),
        'x-e164': Schema.optional(Schema.String.check(Schema.isPattern(/^\+[1-9]\d{6,14}$/))),
        'x-creditcard': Schema.optional(Schema.String),
        'x-iban': Schema.optional(Schema.String),
        'x-currencycode': Schema.optional(Schema.String),
        'x-ksuid': Schema.optional(Schema.String.check(Schema.isPattern(/^[A-Za-z0-9]{27}$/))),
        'x-xid': Schema.optional(Schema.String.check(Schema.isPattern(/^[0-9a-vA-V]{20}$/))),
        'x-guid': Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
            ),
          ),
        ),
        'x-ids': Schema.optional(Schema.Array(Schema.Number.check(Schema.isInt()))),
      }),
    ),
  ),
  (c) => {},
)
