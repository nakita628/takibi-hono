import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const numpasswordHandler = new Hono().get(
  '/numpassword/:value',
  describeRoute({ operationId: 'numpasswordParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.string(),
        v.regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/),
        v.transform((input) => Number(input)),
        v.number(),
        v.finite(),
      ),
    }),
  ),
  (c) => {},
)
