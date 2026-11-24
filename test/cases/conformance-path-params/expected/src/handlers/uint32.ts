import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const uint32Handler = new Hono().get(
  '/uint32/:value',
  describeRoute({ operationId: 'uint32Param', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z.preprocess(
        (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
        z.uint32(),
      ),
    }),
  ),
  (c) => {},
)
