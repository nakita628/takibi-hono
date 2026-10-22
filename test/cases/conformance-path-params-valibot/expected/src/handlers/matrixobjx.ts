import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const matrixobjxHandler = new Hono().get(
  '/matrixobjx/:value',
  describeRoute({ operationId: 'matrixobjxParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.partial(
        v.object({
          a: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
          b: v.string(),
        }),
      ),
    }),
  ),
  (c) => {},
)
