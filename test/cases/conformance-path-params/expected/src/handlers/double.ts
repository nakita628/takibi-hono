import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const doubleHandler = new Hono().get(
  '/double/:value',
  describeRoute({ operationId: 'doubleParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z
        .string()
        .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/)
        .transform((val) => Number(val))
        .pipe(z.number()),
    }),
  ),
  (c) => {},
)
