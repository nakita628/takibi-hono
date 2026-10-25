import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const optionalHandler = new Hono().get(
  '/optional',
  describeRoute({ operationId: 'queryOptional', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.pipe(
      v.unknown(),
      v.transform((input) =>
        typeof input === 'object' && input !== null && !Array.isArray(input)
          ? Object.assign(Object.create(null), input)
          : input,
      ),
      v.partial(
        v.object({
          int_opt: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          int64_opt: v.pipe(
            v.string(),
            v.regex(/^-?\d+$/),
            v.transform((input) => BigInt(input)),
            v.minValue(-9223372036854775808n),
            v.maxValue(9223372036854775807n),
          ),
          num_opt: v.pipe(v.string(), v.transform(Number), v.number(), v.finite()),
          bool_opt: v.pipe(
            v.string(),
            v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
          ),
          str_opt: v.string(),
          uuid_opt: v.pipe(
            v.string(),
            v.regex(
              /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
            ),
          ),
          arr_opt: v.pipe(
            v.unknown(),
            v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
            v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
          ),
          'page-size': v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          'filter[name]': v.string(),
          $top: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          'user.id': v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          'ids[]': v.pipe(
            v.unknown(),
            v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
            v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
          ),
          Int_Opt: v.string(),
          constructor: v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
        }),
      ),
    ),
  ),
  (c) => {},
)
