import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const allofHandler = new Hono().get(
  '/allof/:value',
  describeRoute({ operationId: 'allofParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.intersect([
        v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
        v.any(),
      ]),
    }),
  ),
  (c) => {},
)
