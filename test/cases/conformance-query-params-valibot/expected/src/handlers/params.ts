import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const paramsHandler = new Hono().get(
  '/params',
  describeRoute({ operationId: 'queryParams', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.partial(
      v.object({
        integer: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
        integer_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
        ),
        int32: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.safeInteger(),
          v.minValue(-2147483648),
          v.maxValue(2147483647),
        ),
        int32_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.transform(Number),
              v.number(),
              v.safeInteger(),
              v.minValue(-2147483648),
              v.maxValue(2147483647),
            ),
          ),
        ),
        int64: v.pipe(
          v.string(),
          v.regex(/^-?\d+$/),
          v.transform((input) => BigInt(input)),
          v.minValue(-9223372036854775808n),
          v.maxValue(9223372036854775807n),
        ),
        int64_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(/^-?\d+$/),
              v.transform((input) => BigInt(input)),
              v.minValue(-9223372036854775808n),
              v.maxValue(9223372036854775807n),
            ),
          ),
        ),
        bigint: v.pipe(
          v.string(),
          v.regex(/^-?\d+$/),
          v.transform((input) => BigInt(input)),
          v.bigint(),
        ),
        bigint_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(/^-?\d+$/),
              v.transform((input) => BigInt(input)),
              v.bigint(),
            ),
          ),
        ),
        uint32: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.safeInteger(),
          v.minValue(0),
          v.maxValue(4294967295),
        ),
        uint32_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.transform(Number),
              v.number(),
              v.safeInteger(),
              v.minValue(0),
              v.maxValue(4294967295),
            ),
          ),
        ),
        uint64: v.pipe(
          v.string(),
          v.regex(/^-?\d+$/),
          v.transform((input) => BigInt(input)),
          v.minValue(0n),
          v.maxValue(18446744073709551615n),
        ),
        uint64_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(/^-?\d+$/),
              v.transform((input) => BigInt(input)),
              v.minValue(0n),
              v.maxValue(18446744073709551615n),
            ),
          ),
        ),
        number: v.pipe(v.string(), v.transform(Number), v.number(), v.finite()),
        number_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.finite())),
        ),
        float: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.finite(),
          v.minValue(-3.4028234663852886e38),
          v.maxValue(3.4028234663852886e38),
        ),
        float_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.transform(Number),
              v.number(),
              v.finite(),
              v.minValue(-3.4028234663852886e38),
              v.maxValue(3.4028234663852886e38),
            ),
          ),
        ),
        float32: v.pipe(
          v.string(),
          v.transform(Number),
          v.number(),
          v.finite(),
          v.minValue(-3.4028234663852886e38),
          v.maxValue(3.4028234663852886e38),
        ),
        float32_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.transform(Number),
              v.number(),
              v.finite(),
              v.minValue(-3.4028234663852886e38),
              v.maxValue(3.4028234663852886e38),
            ),
          ),
        ),
        float64: v.pipe(v.string(), v.transform(Number), v.number(), v.finite()),
        float64_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.finite())),
        ),
        double: v.pipe(v.string(), v.transform(Number), v.number(), v.finite()),
        double_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.finite())),
        ),
        numpassword: v.pipe(v.string(), v.transform(Number), v.number(), v.finite()),
        numpassword_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.finite())),
        ),
        boolean: v.pipe(
          v.string(),
          v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
          v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
        ),
        boolean_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
              v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
            ),
          ),
        ),
        string: v.string(),
        string_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.string()),
        ),
        email: v.pipe(v.string(), v.email()),
        email_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.email())),
        ),
        uuid: v.pipe(
          v.string(),
          v.regex(
            /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
          ),
        ),
        uuid_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(
                /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
              ),
            ),
          ),
        ),
        uuidv4: v.pipe(
          v.string(),
          v.regex(
            /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/,
          ),
        ),
        uuidv4_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(
                /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/,
              ),
            ),
          ),
        ),
        uuidv7: v.pipe(
          v.string(),
          v.regex(
            /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-7[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/,
          ),
        ),
        uuidv7_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(
                /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-7[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/,
              ),
            ),
          ),
        ),
        url: v.pipe(v.string(), v.url()),
        url_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.url())),
        ),
        uri: v.pipe(v.string(), v.url()),
        uri_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.url())),
        ),
        httpurl: v.pipe(v.string(), v.url(), v.regex(/^https?:\/\//)),
        httpurl_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.url(), v.regex(/^https?:\/\//))),
        ),
        hostname: v.pipe(
          v.string(),
          v.regex(
            /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
          ),
        ),
        hostname_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(
                /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,
              ),
            ),
          ),
        ),
        hex: v.pipe(v.string(), v.hexadecimal()),
        hex_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.hexadecimal())),
        ),
        emoji: v.pipe(v.string(), v.emoji()),
        emoji_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.emoji())),
        ),
        base64: v.pipe(v.string(), v.base64()),
        base64_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.base64())),
        ),
        base64url: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]*$/)),
        base64url_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]*$/))),
        ),
        nanoid: v.pipe(v.string(), v.nanoid()),
        nanoid_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.nanoid())),
        ),
        cuid2: v.pipe(v.string(), v.cuid2()),
        cuid2_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.cuid2())),
        ),
        ulid: v.pipe(v.string(), v.ulid()),
        ulid_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.ulid())),
        ),
        ipv4: v.pipe(v.string(), v.ipv4()),
        ipv4_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.ipv4())),
        ),
        ipv6: v.pipe(v.string(), v.ipv6()),
        ipv6_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.ipv6())),
        ),
        cidrv4: v.pipe(
          v.string(),
          v.regex(
            /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
          ),
        ),
        cidrv4_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(
                /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
              ),
            ),
          ),
        ),
        cidrv6: v.pipe(
          v.string(),
          v.regex(
            /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
          ),
        ),
        cidrv6_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(
                /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
              ),
            ),
          ),
        ),
        date: v.pipe(
          v.string(),
          v.regex(
            /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$/,
          ),
        ),
        date_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(
                /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$/,
              ),
            ),
          ),
        ),
        time: v.pipe(
          v.string(),
          v.regex(
            /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
          ),
        ),
        time_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(
                /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
              ),
            ),
          ),
        ),
        datetime: v.pipe(
          v.string(),
          v.regex(
            /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
          ),
        ),
        datetime_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(
                /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|([+-](?:[01]\d|2[0-3]):[0-5]\d)))$/,
              ),
            ),
          ),
        ),
        duration: v.pipe(
          v.string(),
          v.regex(
            /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
          ),
        ),
        duration_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(
                /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
              ),
            ),
          ),
        ),
        byte: v.string(),
        byte_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.string()),
        ),
        strpassword: v.string(),
        strpassword_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.string()),
        ),
        mac: v.pipe(v.string(), v.mac()),
        mac_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.mac())),
        ),
        e164: v.pipe(v.string(), v.regex(/^\+[1-9]\d{6,14}$/)),
        e164_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.regex(/^\+[1-9]\d{6,14}$/))),
        ),
        creditcard: v.pipe(v.string(), v.creditCard()),
        creditcard_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.creditCard())),
        ),
        iban: v.string(),
        iban_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.string()),
        ),
        currencycode: v.string(),
        currencycode_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.string()),
        ),
        ksuid: v.pipe(v.string(), v.regex(/^[A-Za-z0-9]{27}$/)),
        ksuid_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.regex(/^[A-Za-z0-9]{27}$/))),
        ),
        xid: v.pipe(v.string(), v.regex(/^[0-9a-vA-V]{20}$/)),
        xid_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.regex(/^[0-9a-vA-V]{20}$/))),
        ),
        guid: v.pipe(
          v.string(),
          v.regex(
            /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
          ),
        ),
        guid_arr: v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(
            v.pipe(
              v.string(),
              v.regex(
                /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
              ),
            ),
          ),
        ),
        tx_trim: v.pipe(v.string(), v.trim()),
        tx_lower: v.pipe(v.string(), v.toLowerCase()),
        tx_upper: v.pipe(v.string(), v.toUpperCase()),
        tx_normalize: v.pipe(v.string(), v.normalize('NFKC')),
        tx_email_trim: v.pipe(v.string(), v.trim(), v.email()),
        tx_uuid_trim: v.pipe(
          v.string(),
          v.trim(),
          v.regex(
            /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
          ),
        ),
        tx_email_lower: v.pipe(v.string(), v.toLowerCase(), v.email()),
      }),
    ),
  ),
  (c) => {},
)
