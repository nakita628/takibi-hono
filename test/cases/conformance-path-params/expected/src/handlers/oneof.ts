import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const oneofHandler = new Hono().get(
  '/oneof/:value',
  describeRoute({ operationId: 'oneofParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z.union([
        z.preprocess(
          (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
          z.number().int(),
        ),
        z.literal('all'),
      ]),
    }),
  ),
  (c) => {},
)
