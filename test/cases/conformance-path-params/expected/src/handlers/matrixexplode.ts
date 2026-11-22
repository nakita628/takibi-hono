import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const matrixexplodeHandler = new Hono().get(
  '/matrixexplode/:value',
  describeRoute({ operationId: 'matrixexplodeParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z.preprocess(
        (val) => (val === undefined || Array.isArray(val) ? val : [val]),
        z.array(
          z
            .string()
            .regex(/^-?(?:0|[1-9]\d*)$/)
            .transform((val) => Number(val))
            .pipe(z.number().int()),
        ),
      ),
    }),
  ),
  (c) => {},
)
