import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const uint32Handler = new Hono().get(
  '/uint32/:value',
  describeRoute({ operationId: 'uint32Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?(?:0|[1-9]\d*)$/),
        v.metadata({ type: 'integer', minimum: 0, maximum: 4294967295 }),
        v.transform((input) => Number(input)),
        v.number(),
        v.safeInteger(),
        v.minValue(0),
        v.maxValue(4294967295),
      ),
    }),
  ),
  (c) => {},
)
