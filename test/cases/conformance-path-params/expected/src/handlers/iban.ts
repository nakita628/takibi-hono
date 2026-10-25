import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const ibanHandler = new Hono().get(
  '/iban/:value',
  describeRoute({ operationId: 'ibanParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z
        .string()
        .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/)
        .refine((val) => {
          let rest = 0
          for (const char of val.slice(4) + val.slice(0, 4)) {
            const n = Number.parseInt(char, 36)
            rest = (n > 9 ? rest * 100 + n : rest * 10 + n) % 97
          }
          return rest === 1
        }),
    }),
  ),
  (c) => {},
)
