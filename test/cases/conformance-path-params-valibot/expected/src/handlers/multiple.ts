import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const multipleHandler = new Hono().get(
  '/multiple/:value',
  describeRoute({ operationId: 'multipleParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?(?:0|[1-9]\d*)$/),
        v.metadata({ type: 'integer', multipleOf: 5 }),
        v.transform((input) => Number(input)),
        v.number(),
        v.safeInteger(),
        v.multipleOf(5),
      ),
    }),
  ),
  (c) => {},
)
