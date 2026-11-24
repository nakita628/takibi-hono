import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const schemarefHandler = new Hono().get(
  '/schemaref/:value',
  describeRoute({ operationId: 'schemarefParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?(?:0|[1-9]\d*)$/),
        v.metadata({ type: 'integer', minimum: 0 }),
        v.transform((input) => Number(input)),
        v.number(),
        v.safeInteger(),
        v.minValue(0),
      ),
    }),
  ),
  (c) => {},
)
