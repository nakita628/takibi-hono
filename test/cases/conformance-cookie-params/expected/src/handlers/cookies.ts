import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const cookiesHandler = new Hono().get(
  '/cookies',
  describeRoute({ operationId: 'cookieParams', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    z.object({
      integer: z.int().exactOptional(),
      int32: z.int32().exactOptional(),
      int64: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.int64())
        .exactOptional(),
      bigint: z.bigint().exactOptional(),
      uint32: z.uint32().exactOptional(),
      uint64: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.uint64())
        .exactOptional(),
      number: z.number().exactOptional(),
      float: z.float32().exactOptional(),
      float32: z.float32().exactOptional(),
      float64: z.float64().exactOptional(),
      double: z.number().exactOptional(),
      numpassword: z.number().exactOptional(),
      boolean: z.boolean().exactOptional(),
      string: z.string().exactOptional(),
      email: z.email().exactOptional(),
      uuid: z.uuid().exactOptional(),
      uuidv4: z.uuidv4().exactOptional(),
      uuidv7: z.uuidv7().exactOptional(),
      url: z.url().exactOptional(),
      uri: z.url().exactOptional(),
      httpurl: z.httpUrl().exactOptional(),
      hostname: z.hostname().exactOptional(),
      hex: z.hex().exactOptional(),
      emoji: z.emoji().exactOptional(),
      base64: z.base64().exactOptional(),
      base64url: z.base64url().exactOptional(),
      nanoid: z.nanoid().exactOptional(),
      cuid2: z.cuid2().exactOptional(),
      ulid: z.ulid().exactOptional(),
      ipv4: z.ipv4().exactOptional(),
      ipv6: z.ipv6().exactOptional(),
      cidrv4: z.cidrv4().exactOptional(),
      cidrv6: z.cidrv6().exactOptional(),
      date: z.iso.date().exactOptional(),
      time: z
        .string()
        .regex(
          /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
        )
        .exactOptional(),
      datetime: z.iso.datetime({ offset: true }).exactOptional(),
      duration: z.iso.duration().exactOptional(),
      byte: z.string().exactOptional(),
      strpassword: z.string().exactOptional(),
      mac: z.mac().exactOptional(),
      e164: z.e164().exactOptional(),
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
      currencycode: z
        .string()
        .regex(
          /^(?:AED|AFN|ALL|AMD|ANG|AOA|ARS|AUD|AWG|AZN|BAM|BBD|BDT|BGN|BHD|BIF|BMD|BND|BOB|BOV|BRL|BSD|BTN|BWP|BYN|BZD|CAD|CDF|CHE|CHF|CHW|CLF|CLP|CNY|COP|COU|CRC|CUP|CVE|CZK|DJF|DKK|DOP|DZD|EGP|ERN|ETB|EUR|FJD|FKP|GBP|GEL|GHS|GIP|GMD|GNF|GTQ|GYD|HKD|HNL|HTG|HUF|IDR|ILS|INR|IQD|IRR|ISK|JMD|JOD|JPY|KES|KGS|KHR|KMF|KPW|KRW|KWD|KYD|KZT|LAK|LBP|LKR|LRD|LSL|LYD|MAD|MDL|MGA|MKD|MMK|MNT|MOP|MRU|MUR|MVR|MWK|MXN|MXV|MYR|MZN|NAD|NGN|NIO|NOK|NPR|NZD|OMR|PAB|PEN|PGK|PHP|PKR|PLN|PYG|QAR|RON|RSD|RUB|RWF|SAR|SBD|SCR|SDG|SEK|SGD|SHP|SLE|SOS|SRD|SSP|STN|SVC|SYP|SZL|THB|TJS|TMT|TND|TOP|TRY|TTD|TWD|TZS|UAH|UGX|USD|USN|UYI|UYU|UYW|UZS|VED|VES|VND|VUV|WST|XAF|XAG|XAU|XBA|XBB|XBC|XBD|XCD|XCG|XDR|XOF|XPD|XPF|XPT|XSU|XTS|XUA|XXX|YER|ZAR|ZMW|ZWG)$/,
        )
        .exactOptional(),
      ksuid: z.ksuid().exactOptional(),
      xid: z.xid().exactOptional(),
      guid: z.guid().exactOptional(),
      ids: z.array(z.int()).exactOptional(),
    }),
  ),
  (c) => {},
)
