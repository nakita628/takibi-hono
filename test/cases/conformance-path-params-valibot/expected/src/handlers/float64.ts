import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const float64Handler = new Hono().get(
  '/float64/:value',
  describeRoute({ operationId: 'float64Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/),
        v.metadata({ type: 'number' }),
        v.transform((input) => Number(input)),
        v.number(),
        v.finite(),
      ),
    }),
  ),
  (c) => {},
)
