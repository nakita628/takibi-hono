import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const labelarrHandler = new Hono().get(
  '/labelarr/:value',
  describeRoute({ operationId: 'labelarrParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z.preprocess(
        (val) => (val === undefined || Array.isArray(val) ? val : [val]),
        z.array(z.coerce.number().int()),
      ),
    }),
  ),
  (c) => {},
)
