import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { Schema } from 'effect'
import { FieldsResponse } from '../components'

export const headersHandler = new Hono().get(
  '/headers',
  describeRoute({ operationId: 'headerParams', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    Schema.toStandardSchemaV1(
      Schema.Struct({
        'x-integer': Schema.optional(Schema.Number.check(Schema.isInt())),
        'x-int32': Schema.optional(Schema.Number.check(Schema.isInt())),
        'x-int64': Schema.optional(Schema.Number.check(Schema.isInt())),
        'x-bigint': Schema.optional(Schema.BigInt),
        'x-uint32': Schema.optional(Schema.Number.check(Schema.isInt())),
        'x-uint64': Schema.optional(Schema.Number.check(Schema.isInt())),
        'x-number': Schema.optional(Schema.Number),
        'x-float': Schema.optional(Schema.Number),
        'x-float32': Schema.optional(Schema.Number),
        'x-float64': Schema.optional(Schema.Number),
        'x-double': Schema.optional(Schema.Number),
        'x-numpassword': Schema.optional(Schema.Number),
        'x-boolean': Schema.optional(Schema.Boolean),
        'x-string': Schema.optional(Schema.String),
        'x-email': Schema.optional(
          Schema.String.check(Schema.isPattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)),
        ),
        'x-uuid': Schema.optional(Schema.String.check(Schema.isUUID())),
        'x-uuidv4': Schema.optional(Schema.String),
        'x-uuidv7': Schema.optional(Schema.String),
        'x-url': Schema.optional(Schema.String),
        'x-uri': Schema.optional(Schema.String.check(Schema.isPattern(/^https?:\/\//))),
        'x-httpurl': Schema.optional(Schema.String),
        'x-hostname': Schema.optional(Schema.String),
        'x-hex': Schema.optional(Schema.String),
        'x-base64': Schema.optional(Schema.String),
        'x-base64url': Schema.optional(Schema.String),
        'x-nanoid': Schema.optional(Schema.String),
        'x-cuid2': Schema.optional(Schema.String),
        'x-ulid': Schema.optional(Schema.String.check(Schema.isULID())),
        'x-ipv4': Schema.optional(
          Schema.String.check(
            Schema.isPattern(
              /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
            ),
          ),
        ),
        'x-ipv6': Schema.optional(
          Schema.String.check(Schema.isPattern(/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)),
        ),
        'x-cidrv4': Schema.optional(Schema.String),
        'x-cidrv6': Schema.optional(Schema.String),
        'x-date': Schema.optional(Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/))),
        'x-time': Schema.optional(Schema.String.check(Schema.isPattern(/^\d{2}:\d{2}:\d{2}/))),
        'x-datetime': Schema.optional(
          Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
        ),
        'x-duration': Schema.optional(Schema.String),
        'x-byte': Schema.optional(Schema.String),
        'x-strpassword': Schema.optional(Schema.String),
        'x-mac': Schema.optional(Schema.String),
        'x-e164': Schema.optional(Schema.String),
        'x-creditcard': Schema.optional(Schema.String),
        'x-iban': Schema.optional(Schema.String),
        'x-currencycode': Schema.optional(Schema.String),
        'x-ksuid': Schema.optional(Schema.String),
        'x-xid': Schema.optional(Schema.String),
        'x-guid': Schema.optional(Schema.String),
        'x-ids': Schema.optional(Schema.Array(Schema.Number.check(Schema.isInt()))),
      }),
    ),
  ),
  (c) => {},
)
