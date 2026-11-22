import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const nenumHandler = new Hono().get(
  '/nenum/:value',
  describeRoute({ operationId: 'nenumParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/),
        v.transform((input) => Number(input)),
        v.union([v.literal(0.5), v.literal(2.5)]),
      ),
    }),
  ),
  (c) => {},
)
