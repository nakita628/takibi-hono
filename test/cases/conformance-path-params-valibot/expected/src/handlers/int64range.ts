import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const int64rangeHandler = new Hono().get(
  '/int64range/:value',
  describeRoute({ operationId: 'int64rangeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?\d+$/),
        v.transform((input) => BigInt(input)),
        v.minValue(-9223372036854775808n),
        v.maxValue(9223372036854775807n),
        v.minValue(1n),
        v.maxValue(100n),
      ),
    }),
  ),
  (c) => {},
)
