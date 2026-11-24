import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const allofHandler = new Hono().get(
  '/allof/:value',
  describeRoute({ operationId: 'allofParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z.preprocess(
        (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
        z.number().int().min(5),
      ),
    }),
  ),
  (c) => {},
)
