import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const matrixobjHandler = new Hono().get(
  '/matrixobj/:value',
  describeRoute({ operationId: 'matrixobjParam', responses: { '200': EchoResponse } }),
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
