import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { EchoResponse } from '../components'

export const labelarrHandler = new Hono().get(
  '/labelarr/:value',
  describeRoute({ operationId: 'labelarrParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    v.object({
      value: v.pipe(
        v.unknown(),
        v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
        v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
      ),
    }),
  ),
  (c) => {},
)
