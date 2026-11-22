import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const iconstHandler = new Hono().get(
  '/iconst/:value',
  describeRoute({ operationId: 'iconstParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z
        .string()
        .regex(/^-?(?:0|[1-9]\d*)$/)
        .transform((val) => Number(val))
        .pipe(z.literal(7)),
    }),
  ),
  (c) => {},
)
