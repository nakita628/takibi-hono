import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const rangeHandler = new Hono().get(
  '/range/:value',
  describeRoute({ operationId: 'rangeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?(?:0|[1-9]\d*)$/),
        v.metadata({ type: 'integer', minimum: 1, maximum: 10 }),
        v.transform((input) => Number(input)),
        v.number(),
        v.safeInteger(),
        v.minValue(1),
        v.maxValue(10),
      ),
    }),
  ),
  (c) => {},
)
