import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const nenumHandler = new Hono().get(
  '/nenum/:value',
  describeRoute({ operationId: 'nenumParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z
        .string()
        .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/)
        .transform((val) => Number(val))
        .pipe(z.union([z.literal(0.5), z.literal(2.5)])),
    }),
  ),
  (c) => {},
)
