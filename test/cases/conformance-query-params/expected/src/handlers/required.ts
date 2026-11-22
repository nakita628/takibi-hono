import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'queryRequired', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      id: z
        .string()
        .regex(/^-?(?:0|[1-9]\d*)$/)
        .transform((val) => Number(val))
        .pipe(z.number().int()),
      big: z.coerce.bigint().pipe(z.int64()),
      flag: z.stringbool(),
      name: z.string(),
      tags: z.preprocess(
        (val) => (val === undefined || Array.isArray(val) ? val : [val]),
        z.array(
          z
            .string()
            .regex(/^-?(?:0|[1-9]\d*)$/)
            .transform((val) => Number(val))
            .pipe(z.number().int()),
        ),
      ),
      note: z
        .string()
        .regex(/^-?(?:0|[1-9]\d*)$/)
        .transform((val) => Number(val))
        .pipe(z.number().int())
        .exactOptional(),
    }),
  ),
  (c) => {},
)
