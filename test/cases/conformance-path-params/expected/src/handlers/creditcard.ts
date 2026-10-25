import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { EchoResponse } from '../components'

export const creditcardHandler = new Hono().get(
  '/creditcard/:value',
  describeRoute({ operationId: 'creditcardParam', responses: { '200': EchoResponse } }),
  validator(
    'param',
    z.object({
      value: z
        .string()
        .regex(/^\d{12,19}$/)
        .refine((val) => {
          let sum = 0
          for (let i = 0; i < val.length; i++) {
            let digit = Number(val[val.length - 1 - i])
            if (i % 2 === 1) {
              digit *= 2
              if (digit > 9) digit -= 9
            }
            sum += digit
          }
          return sum % 10 === 0
        }),
    }),
  ),
  (c) => {},
)
