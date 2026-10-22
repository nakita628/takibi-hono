import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const oneofHandler = new Hono().get(
  '/oneof/:value',
  describeRoute({ operationId: 'oneofParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.union([
        v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
        v.literal('all'),
      ]),
    }),
  ),
  (c) => {},
)
