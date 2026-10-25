import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const matrixarrHandler = new Hono().get(
  '/matrixarr/:value',
  describeRoute({ operationId: 'matrixarrParam', responses: { '200': EchoResponse } }),
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
