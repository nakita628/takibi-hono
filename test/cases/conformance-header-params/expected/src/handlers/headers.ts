import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const headersHandler = new Hono().get(
  '/headers',
  describeRoute({ operationId: 'headerParams', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    z.object({
      'x-integer': z.coerce.number().int().exactOptional(),
      'x-int32': z.coerce.number().pipe(z.int32()).exactOptional(),
      'x-int64': z.coerce.bigint().pipe(z.int64()).exactOptional(),
      'x-bigint': z.coerce.bigint().exactOptional(),
      'x-uint32': z.coerce.number().pipe(z.uint32()).exactOptional(),
      'x-uint64': z.coerce.bigint().pipe(z.uint64()).exactOptional(),
      'x-number': z.coerce.number().exactOptional(),
      'x-float': z.coerce.number().pipe(z.float32()).exactOptional(),
      'x-float32': z.coerce.number().pipe(z.float32()).exactOptional(),
      'x-float64': z.coerce.number().pipe(z.float64()).exactOptional(),
      'x-double': z.coerce.number().exactOptional(),
      'x-numpassword': z.coerce.number().exactOptional(),
      'x-boolean': z.stringbool().exactOptional(),
      'x-string': z.string().exactOptional(),
      'x-email': z.email().exactOptional(),
      'x-uuid': z.uuid().exactOptional(),
      'x-uuidv4': z.uuidv4().exactOptional(),
      'x-uuidv7': z.uuidv7().exactOptional(),
      'x-url': z.url().exactOptional(),
      'x-uri': z.url().exactOptional(),
      'x-httpurl': z.httpUrl().exactOptional(),
      'x-hostname': z.hostname().exactOptional(),
      'x-hex': z.hex().exactOptional(),
      'x-base64': z.base64().exactOptional(),
      'x-base64url': z.base64url().exactOptional(),
      'x-nanoid': z.nanoid().exactOptional(),
      'x-cuid2': z.cuid2().exactOptional(),
      'x-ulid': z.ulid().exactOptional(),
      'x-ipv4': z.ipv4().exactOptional(),
      'x-ipv6': z.ipv6().exactOptional(),
      'x-cidrv4': z.cidrv4().exactOptional(),
      'x-cidrv6': z.cidrv6().exactOptional(),
      'x-date': z.iso.date().exactOptional(),
      'x-time': z
        .string()
        .regex(
          /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
        )
        .exactOptional(),
      'x-datetime': z.iso.datetime({ offset: true }).exactOptional(),
      'x-duration': z.iso.duration().exactOptional(),
      'x-byte': z.string().exactOptional(),
      'x-strpassword': z.string().exactOptional(),
      'x-mac': z.mac().exactOptional(),
      'x-e164': z.e164().exactOptional(),
      'x-creditcard': z
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
      'x-iban': z
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
      'x-currencycode': z
        .string()
        .regex(
          /^(?:AED|AFN|ALL|AMD|ANG|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BGN|BHD|BIF|BMD|BND|BOB|BOV|BRL|BSD|BTN|BWP|BYN|BZD|CAD|CDF|CHE|CHF|CHW|CLF|CLP|CNY|COP|COU|CRC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRU|MUR|MVR|MWK|MXN|MXV|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLE|SOS|SRD|SSP|STN|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|USN|UYI|UYU|UYW|UZS|VED|VES|VND|VUV|WST|XAF|XAG|XAU|XBA|XBB|XBC|XBD|XCD|XCG|XDR|XOF|XPD|XPF|XPT|XSU|XTS|XUA|XXX|YER|ZAR|ZMW|ZWG)$/,
        )
        .exactOptional(),
      'x-ksuid': z.ksuid().exactOptional(),
      'x-xid': z.xid().exactOptional(),
      'x-guid': z.guid().exactOptional(),
      'x-ids': z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(z.coerce.number().int()),
        )
        .exactOptional(),
    }),
  ),
  (c) => {},
)
