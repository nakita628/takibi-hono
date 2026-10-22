import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const cookiesHandler = new Hono().get(
  '/cookies',
  describeRoute({ operationId: 'cookieParams', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        integer: Schema.optional(Schema.Number.check(Schema.isInt())),
        int32: Schema.optional(Schema.Number.check(Schema.isInt())),
        int64: Schema.optional(Schema.Number.check(Schema.isInt())),
        bigint: Schema.optional(Schema.BigInt),
        uint32: Schema.optional(Schema.Number.check(Schema.isInt())),
        uint64: Schema.optional(Schema.Number.check(Schema.isInt())),
        number: Schema.optional(Schema.Number),
        float: Schema.optional(Schema.Number),
        float32: Schema.optional(Schema.Number),
        float64: Schema.optional(Schema.Number),
        double: Schema.optional(Schema.Number),
        numpassword: Schema.optional(Schema.Number),
        boolean: Schema.optional(Schema.Boolean),
        string: Schema.optional(Schema.String),
        email: Schema.optional(
          Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
        ),
        uuid: Schema.optional(Schema.String.check(Schema.isUUID())),
        uuidv4: Schema.optional(Schema.String),
        uuidv7: Schema.optional(Schema.String),
        url: Schema.optional(Schema.String),
        uri: Schema.optional(Schema.String.check(Schema.isPattern(/^https?:\/\//))),
        httpurl: Schema.optional(Schema.String),
        hostname: Schema.optional(Schema.String),
        hex: Schema.optional(Schema.String),
        emoji: Schema.optional(Schema.String),
        base64: Schema.optional(Schema.String),
        base64url: Schema.optional(Schema.String),
        nanoid: Schema.optional(Schema.String),
        cuid2: Schema.optional(Schema.String),
        ulid: Schema.optional(Schema.String.check(Schema.isULID())),
        ipv4: Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
            ),
          ),
        ),
        ipv6: Schema.optional(
          Schema.String.check(Schema.isPattern(/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)),
        ),
        cidrv4: Schema.optional(Schema.String),
        cidrv6: Schema.optional(Schema.String),
        date: Schema.optional(Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/))),
        time: Schema.optional(Schema.String.check(Schema.isPattern(/^\d{2}:\d{2}:\d{2}/))),
        datetime: Schema.optional(
          Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
        ),
        duration: Schema.optional(Schema.String),
        byte: Schema.optional(Schema.String),
        strpassword: Schema.optional(Schema.String),
        mac: Schema.optional(Schema.String),
        e164: Schema.optional(Schema.String),
        creditcard: Schema.optional(Schema.String),
        iban: Schema.optional(Schema.String),
        currencycode: Schema.optional(Schema.String),
        ksuid: Schema.optional(Schema.String),
        xid: Schema.optional(Schema.String),
        guid: Schema.optional(Schema.String),
        ids: Schema.optional(Schema.Array(Schema.Number.check(Schema.isInt()))),
      }),
    ),
  ),
  (c) => {},
)
