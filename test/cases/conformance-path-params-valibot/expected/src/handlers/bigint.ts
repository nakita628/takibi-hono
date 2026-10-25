import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const bigintHandler = new Hono().get(
  '/bigint/:value',
  describeRoute({ operationId: 'bigintParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?\d+$/),
        v.transform((input) => BigInt(input)),
        v.bigint(),
      ),
    }),
  ),
  (c) => {},
)
