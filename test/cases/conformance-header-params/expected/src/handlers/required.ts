import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'headerRequired', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    z.object({
      'x-id': z.preprocess(
        (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
        z.number().int(),
      ),
      'x-big': z.coerce.bigint().pipe(z.int64()),
      'x-flag': z.stringbool(),
      'x-name': z.string(),
      'x-note': z
        .preprocess(
          (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
          z.number().int(),
        )
        .exactOptional(),
    }),
  ),
  (c) => {},
)
