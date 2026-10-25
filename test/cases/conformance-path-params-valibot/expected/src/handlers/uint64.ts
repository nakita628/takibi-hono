import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const uint64Handler = new Hono().get(
  '/uint64/:value',
  describeRoute({ operationId: 'uint64Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?\d+$/),
        v.transform((input) => BigInt(input)),
        v.minValue(0n),
        v.maxValue(18446744073709551615n),
      ),
    }),
  ),
  (c) => {},
)
