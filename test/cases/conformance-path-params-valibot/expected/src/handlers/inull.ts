import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const inullHandler = new Hono().get(
  '/inull/:value',
  describeRoute({ operationId: 'inullParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.nullable(v.pipe(v.string(), v.transform(Number), v.number(), v.integer())),
    }),
  ),
  (c) => {},
)
