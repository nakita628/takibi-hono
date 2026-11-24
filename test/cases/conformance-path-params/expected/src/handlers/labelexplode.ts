import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const labelexplodeHandler = new Hono().get(
  '/labelexplode/:value',
  describeRoute({ operationId: 'labelexplodeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z.preprocess(
        (val) => (val === undefined || Array.isArray(val) ? val : [val]),
        z.array(
          z.preprocess(
            (val) =>
              typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
            z.number().int(),
          ),
        ),
      ),
    }),
  ),
  (c) => {},
)
