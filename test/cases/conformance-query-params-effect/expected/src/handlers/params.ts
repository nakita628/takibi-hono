import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema, SchemaTransformation } from 'effect'
import { FieldsResponse } from '../components'

export const paramsHandler = new Hono().get(
  '/params',
  describeRoute({ operationId: 'queryParams', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        integer: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
        integer_arr: Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        int32: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
        int32_arr: Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        int64: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
        int64_arr: Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        bigint: Schema.optional(Schema.BigInt),
        bigint_arr: Schema.optional(Schema.Array(Schema.BigInt)),
        uint32: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
        uint32_arr: Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        uint64: Schema.optional(Schema.NumberFromString.check(Schema.isInt())),
        uint64_arr: Schema.optional(Schema.Array(Schema.NumberFromString.check(Schema.isInt()))),
        number: Schema.optional(Schema.NumberFromString),
        number_arr: Schema.optional(Schema.Array(Schema.NumberFromString)),
        float: Schema.optional(Schema.NumberFromString),
        float_arr: Schema.optional(Schema.Array(Schema.NumberFromString)),
        float32: Schema.optional(Schema.NumberFromString),
        float32_arr: Schema.optional(Schema.Array(Schema.NumberFromString)),
        float64: Schema.optional(Schema.NumberFromString),
        float64_arr: Schema.optional(Schema.Array(Schema.NumberFromString)),
        double: Schema.optional(Schema.NumberFromString),
        double_arr: Schema.optional(Schema.Array(Schema.NumberFromString)),
        numpassword: Schema.optional(Schema.NumberFromString),
        numpassword_arr: Schema.optional(Schema.Array(Schema.NumberFromString)),
        boolean: Schema.optional(
          Schema.Literals(['true', 'false']).pipe(
            Schema.decodeTo(
              Schema.Boolean,
              SchemaTransformation.transform({
                decode: (input) => input === 'true',
                encode: (input) => (input ? 'true' : 'false'),
              }),
            ),
          ),
        ),
        boolean_arr: Schema.optional(
          Schema.Array(
            Schema.Literals(['true', 'false']).pipe(
              Schema.decodeTo(
                Schema.Boolean,
                SchemaTransformation.transform({
                  decode: (input) => input === 'true',
                  encode: (input) => (input ? 'true' : 'false'),
                }),
              ),
            ),
          ),
        ),
        string: Schema.optional(Schema.String),
        string_arr: Schema.optional(Schema.Array(Schema.String)),
        email: Schema.optional(
          Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
        ),
        email_arr: Schema.optional(
          Schema.Array(
            Schema.String.check(
              Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
            ),
          ),
        ),
        uuid: Schema.optional(Schema.String.check(Schema.isUUID())),
        uuid_arr: Schema.optional(Schema.Array(Schema.String.check(Schema.isUUID()))),
        uuidv4: Schema.optional(Schema.String),
        uuidv4_arr: Schema.optional(Schema.Array(Schema.String)),
        uuidv7: Schema.optional(Schema.String),
        uuidv7_arr: Schema.optional(Schema.Array(Schema.String)),
        url: Schema.optional(Schema.String),
        url_arr: Schema.optional(Schema.Array(Schema.String)),
        uri: Schema.optional(Schema.String.check(Schema.isPattern(/^https?:\/\//))),
        uri_arr: Schema.optional(
          Schema.Array(Schema.String.check(Schema.isPattern(/^https?:\/\//))),
        ),
        httpurl: Schema.optional(Schema.String),
        httpurl_arr: Schema.optional(Schema.Array(Schema.String)),
        hostname: Schema.optional(Schema.String),
        hostname_arr: Schema.optional(Schema.Array(Schema.String)),
        hex: Schema.optional(Schema.String),
        hex_arr: Schema.optional(Schema.Array(Schema.String)),
        emoji: Schema.optional(Schema.String),
        emoji_arr: Schema.optional(Schema.Array(Schema.String)),
        base64: Schema.optional(Schema.String),
        base64_arr: Schema.optional(Schema.Array(Schema.String)),
        base64url: Schema.optional(Schema.String),
        base64url_arr: Schema.optional(Schema.Array(Schema.String)),
        nanoid: Schema.optional(Schema.String),
        nanoid_arr: Schema.optional(Schema.Array(Schema.String)),
        cuid2: Schema.optional(Schema.String),
        cuid2_arr: Schema.optional(Schema.Array(Schema.String)),
        ulid: Schema.optional(Schema.String.check(Schema.isULID())),
        ulid_arr: Schema.optional(Schema.Array(Schema.String.check(Schema.isULID()))),
        ipv4: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
            ),
          ),
        ),
        ipv4_arr: Schema.optional(
          Schema.Array(
            Schema.String.check(
              Schema.isPattern(
                /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
              ),
            ),
          ),
        ),
        ipv6: Schema.optional(
          Schema.String.check(Schema.isPattern(/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)),
        ),
        ipv6_arr: Schema.optional(
          Schema.Array(
            Schema.String.check(Schema.isPattern(/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)),
          ),
        ),
        cidrv4: Schema.optional(Schema.String),
        cidrv4_arr: Schema.optional(Schema.Array(Schema.String)),
        cidrv6: Schema.optional(Schema.String),
        cidrv6_arr: Schema.optional(Schema.Array(Schema.String)),
        date: Schema.optional(Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/))),
        date_arr: Schema.optional(
          Schema.Array(Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/))),
        ),
        time: Schema.optional(Schema.String.check(Schema.isPattern(/^\d{2}:\d{2}:\d{2}/))),
        time_arr: Schema.optional(
          Schema.Array(Schema.String.check(Schema.isPattern(/^\d{2}:\d{2}:\d{2}/))),
        ),
        datetime: Schema.optional(
          Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
        ),
        datetime_arr: Schema.optional(
          Schema.Array(
            Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
          ),
        ),
        duration: Schema.optional(Schema.String),
        duration_arr: Schema.optional(Schema.Array(Schema.String)),
        byte: Schema.optional(Schema.String),
        byte_arr: Schema.optional(Schema.Array(Schema.String)),
        strpassword: Schema.optional(Schema.String),
        strpassword_arr: Schema.optional(Schema.Array(Schema.String)),
        mac: Schema.optional(Schema.String),
        mac_arr: Schema.optional(Schema.Array(Schema.String)),
        e164: Schema.optional(Schema.String),
        e164_arr: Schema.optional(Schema.Array(Schema.String)),
        creditcard: Schema.optional(Schema.String),
        creditcard_arr: Schema.optional(Schema.Array(Schema.String)),
        iban: Schema.optional(Schema.String),
        iban_arr: Schema.optional(Schema.Array(Schema.String)),
        currencycode: Schema.optional(Schema.String),
        currencycode_arr: Schema.optional(Schema.Array(Schema.String)),
        ksuid: Schema.optional(Schema.String),
        ksuid_arr: Schema.optional(Schema.Array(Schema.String)),
        xid: Schema.optional(Schema.String),
        xid_arr: Schema.optional(Schema.Array(Schema.String)),
        guid: Schema.optional(Schema.String),
        guid_arr: Schema.optional(Schema.Array(Schema.String)),
        tx_trim: Schema.optional(Schema.Trim),
        tx_lower: Schema.optional(
          Schema.String.pipe(Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase())),
        ),
        tx_upper: Schema.optional(
          Schema.String.pipe(Schema.decodeTo(Schema.String, SchemaTransformation.toUpperCase())),
        ),
        tx_normalize: Schema.optional(Schema.String),
        tx_email_trim: Schema.optional(
          Schema.Trim.check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
        ),
        tx_uuid_trim: Schema.optional(Schema.String.check(Schema.isUUID())),
        tx_email_lower: Schema.optional(
          Schema.String.pipe(
            Schema.decodeTo(Schema.String, SchemaTransformation.toLowerCase()),
          ).check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
        ),
      }),
    ),
  ),
  (c) => {},
)
