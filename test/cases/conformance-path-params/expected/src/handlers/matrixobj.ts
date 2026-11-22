import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const matrixobjHandler = new Hono().get(
  '/matrixobj/:value',
  describeRoute({ operationId: 'matrixobjParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z.object({
        a: z
          .string()
          .regex(/^-?(?:0|[1-9]\d*)$/)
          .transform((val) => Number(val))
          .pipe(z.number().int())
          .exactOptional(),
        b: z.string().exactOptional(),
      }),
    }),
  ),
  (c) => {},
)
