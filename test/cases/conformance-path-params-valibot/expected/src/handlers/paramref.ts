import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const paramrefHandler = new Hono().get(
  '/paramref/:id',
  describeRoute({ operationId: 'paramrefParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      id: v.pipe(
        v.string(),
        v.regex(/^-?\d+$/),
        v.transform((input) => BigInt(input)),
        v.minValue(-9223372036854775808n),
        v.maxValue(9223372036854775807n),
      ),
    }),
  ),
  (c) => {},
)
