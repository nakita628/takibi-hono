import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const labelobjxHandler = new Hono().get(
  '/labelobjx/:value',
  describeRoute({ operationId: 'labelobjxParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.partial(
        v.object({
          a: v.pipe(
            v.string(),
            v.regex(/^-?(?:0|[1-9]\d*)$/),
            v.metadata({ type: 'integer' }),
            v.transform((input) => Number(input)),
            v.number(),
            v.safeInteger(),
          ),
          b: v.string(),
        }),
      ),
    }),
  ),
  (c) => {},
)
