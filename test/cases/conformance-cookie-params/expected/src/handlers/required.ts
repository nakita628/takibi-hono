import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'cookieRequired', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    z.object({
      id: z.coerce.number().int(),
      big: z.coerce.bigint().pipe(z.int64()),
      flag: z.stringbool(),
      name: z.string(),
      note: z.coerce.number().int().exactOptional(),
    }),
  ),
  (c) => {},
)
