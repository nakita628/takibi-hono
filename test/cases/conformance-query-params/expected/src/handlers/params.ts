import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const paramsHandler = new Hono().get(
  '/params',
  describeRoute({ operationId: 'queryParams', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      integer: z.coerce.number().int().exactOptional(),
      integer_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number().int()),
        )
        .exactOptional(),
      int32: z.coerce.number().pipe(z.int32()).exactOptional(),
      int32_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number().pipe(z.int32())),
        )
        .exactOptional(),
      int64: z.coerce.bigint().pipe(z.int64()).exactOptional(),
      int64_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.bigint().pipe(z.int64())),
        )
        .exactOptional(),
      bigint: z.coerce.bigint().exactOptional(),
      bigint_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.bigint()),
        )
        .exactOptional(),
      uint32: z.coerce.number().pipe(z.uint32()).exactOptional(),
      uint32_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number().pipe(z.uint32())),
        )
        .exactOptional(),
      uint64: z.coerce.bigint().pipe(z.uint64()).exactOptional(),
      uint64_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.bigint().pipe(z.uint64())),
        )
        .exactOptional(),
      number: z.coerce.number().exactOptional(),
      number_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number()),
        )
        .exactOptional(),
      float: z.coerce.number().pipe(z.float32()).exactOptional(),
      float_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number().pipe(z.float32())),
        )
        .exactOptional(),
      float32: z.coerce.number().pipe(z.float32()).exactOptional(),
      float32_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number().pipe(z.float32())),
        )
        .exactOptional(),
      float64: z.coerce.number().pipe(z.float64()).exactOptional(),
      float64_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number().pipe(z.float64())),
        )
        .exactOptional(),
      double: z.coerce.number().exactOptional(),
      double_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number()),
        )
        .exactOptional(),
      numpassword: z.coerce.number().exactOptional(),
      numpassword_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number()),
        )
        .exactOptional(),
      boolean: z.stringbool().exactOptional(),
      boolean_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.stringbool()),
        )
        .exactOptional(),
      string: z.string().exactOptional(),
      string_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.string()),
        )
        .exactOptional(),
      email: z.email().exactOptional(),
      email_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.email()),
        )
        .exactOptional(),
      uuid: z.uuid().exactOptional(),
      uuid_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.uuid()),
        )
        .exactOptional(),
      uuidv4: z.uuidv4().exactOptional(),
      uuidv4_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.uuidv4()),
        )
        .exactOptional(),
      uuidv7: z.uuidv7().exactOptional(),
      uuidv7_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.uuidv7()),
        )
        .exactOptional(),
      url: z.url().exactOptional(),
      url_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.url()),
        )
        .exactOptional(),
      uri: z.url().exactOptional(),
      uri_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.url()),
        )
        .exactOptional(),
      httpurl: z.httpUrl().exactOptional(),
      httpurl_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.httpUrl()),
        )
        .exactOptional(),
      hostname: z.hostname().exactOptional(),
      hostname_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.hostname()),
        )
        .exactOptional(),
      hex: z.hex().exactOptional(),
      hex_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.hex()),
        )
        .exactOptional(),
      emoji: z.emoji().exactOptional(),
      emoji_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.emoji()),
        )
        .exactOptional(),
      base64: z.base64().exactOptional(),
      base64_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.base64()),
        )
        .exactOptional(),
      base64url: z.base64url().exactOptional(),
      base64url_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.base64url()),
        )
        .exactOptional(),
      nanoid: z.nanoid().exactOptional(),
      nanoid_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.nanoid()),
        )
        .exactOptional(),
      cuid2: z.cuid2().exactOptional(),
      cuid2_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.cuid2()),
        )
        .exactOptional(),
      ulid: z.ulid().exactOptional(),
      ulid_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.ulid()),
        )
        .exactOptional(),
      ipv4: z.ipv4().exactOptional(),
      ipv4_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.ipv4()),
        )
        .exactOptional(),
      ipv6: z.ipv6().exactOptional(),
      ipv6_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.ipv6()),
        )
        .exactOptional(),
      cidrv4: z.cidrv4().exactOptional(),
      cidrv4_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.cidrv4()),
        )
        .exactOptional(),
      cidrv6: z.cidrv6().exactOptional(),
      cidrv6_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.cidrv6()),
        )
        .exactOptional(),
      date: z.iso.date().exactOptional(),
      date_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.iso.date()),
        )
        .exactOptional(),
      time: z
        .string()
        .regex(
          /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
        )
        .exactOptional(),
      time_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(
            z
              .string()
              .regex(
                /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
              ),
          ),
        )
        .exactOptional(),
      datetime: z.iso.datetime({ offset: true }).exactOptional(),
      datetime_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.iso.datetime({ offset: true })),
        )
        .exactOptional(),
      duration: z.iso.duration().exactOptional(),
      duration_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.iso.duration()),
        )
        .exactOptional(),
      byte: z.string().exactOptional(),
      byte_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.string()),
        )
        .exactOptional(),
      strpassword: z.string().exactOptional(),
      strpassword_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.string()),
        )
        .exactOptional(),
      mac: z.mac().exactOptional(),
      mac_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.mac()),
        )
        .exactOptional(),
      e164: z.e164().exactOptional(),
      e164_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.e164()),
        )
        .exactOptional(),
      creditcard: z
        .string()
        .regex(/^\d{12,19}$/)
        .refine((val) => {
          let sum = 0
          for (let i = 0; i < val.length; i++) {
            let digit = Number(val[val.length - 1 - i])
            if (i % 2 === 1) {
              digit *= 2
              if (digit > 9) digit -= 9
            }
            sum += digit
          }
          return sum % 10 === 0
        })
        .exactOptional(),
      creditcard_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(
            z
              .string()
              .regex(/^\d{12,19}$/)
              .refine((val) => {
                let sum = 0
                for (let i = 0; i < val.length; i++) {
                  let digit = Number(val[val.length - 1 - i])
                  if (i % 2 === 1) {
                    digit *= 2
                    if (digit > 9) digit -= 9
                  }
                  sum += digit
                }
                return sum % 10 === 0
              }),
          ),
        )
        .exactOptional(),
      iban: z
        .string()
        .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/)
        .refine((val) => {
          let rest = 0
          for (const char of val.slice(4) + val.slice(0, 4)) {
            const n = Number.parseInt(char, 36)
            rest = (n > 9 ? rest * 100 + n : rest * 10 + n) % 97
          }
          return rest === 1
        })
        .exactOptional(),
      iban_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(
            z
              .string()
              .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/)
              .refine((val) => {
                let rest = 0
                for (const char of val.slice(4) + val.slice(0, 4)) {
                  const n = Number.parseInt(char, 36)
                  rest = (n > 9 ? rest * 100 + n : rest * 10 + n) % 97
                }
                return rest === 1
              }),
          ),
        )
        .exactOptional(),
      currencycode: z
        .string()
        .regex(
          /^(?:AED|AFN|ALL|AMD|ANG|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BGN|BHD|BIF|BMD|BND|BOB|BOV|BRL|BSD|BTN|BWP|BYN|BZD|CAD|CDF|CHE|CHF|CHW|CLF|CLP|CNY|COP|COU|CRC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRU|MUR|MVR|MWK|MXN|MXV|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLE|SOS|SRD|SSP|STN|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|USN|UYI|UYU|UYW|UZS|VED|VES|VND|VUV|WST|XAF|XAG|XAU|XBA|XBB|XBC|XBD|XCD|XCG|XDR|XOF|XPD|XPF|XPT|XSU|XTS|XUA|XXX|YER|ZAR|ZMW|ZWG)$/,
        )
        .exactOptional(),
      currencycode_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(
            z
              .string()
              .regex(
                /^(?:AED|AFN|ALL|AMD|ANG|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BGN|BHD|BIF|BMD|BND|BOB|BOV|BRL|BSD|BTN|BWP|BYN|BZD|CAD|CDF|CHE|CHF|CHW|CLF|CLP|CNY|COP|COU|CRC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRU|MUR|MVR|MWK|MXN|MXV|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLE|SOS|SRD|SSP|STN|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|USN|UYI|UYU|UYW|UZS|VED|VES|VND|VUV|WST|XAF|XAG|XAU|XBA|XBB|XBC|XBD|XCD|XCG|XDR|XOF|XPD|XPF|XPT|XSU|XTS|XUA|XXX|YER|ZAR|ZMW|ZWG)$/,
              ),
          ),
        )
        .exactOptional(),
      ksuid: z.ksuid().exactOptional(),
      ksuid_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.ksuid()),
        )
        .exactOptional(),
      xid: z.xid().exactOptional(),
      xid_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.xid()),
        )
        .exactOptional(),
      guid: z.guid().exactOptional(),
      guid_arr: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.guid()),
        )
        .exactOptional(),
      tx_trim: z.string().trim().exactOptional(),
      tx_lower: z.string().toLowerCase().exactOptional(),
      tx_upper: z.string().toUpperCase().exactOptional(),
      tx_normalize: z.string().normalize('NFKC').exactOptional(),
      tx_email_trim: z.string().trim().pipe(z.email()).exactOptional(),
      tx_uuid_trim: z.string().trim().pipe(z.uuid()).exactOptional(),
      tx_email_lower: z.string().toLowerCase().pipe(z.email()).exactOptional(),
    }),
  ),
  (c) => {},
)
