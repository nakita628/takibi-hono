import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'cookieDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    z.object({
      int_def: z.coerce.number().int().default(20).exactOptional(),
      int64_def: z.coerce.bigint().pipe(z.int64()).default(5n).exactOptional(),
      bool_def: z.stringbool().default(false).exactOptional(),
      str_def: z.string().default('fallback').exactOptional(),
    }),
  ),
  (c) => {},
)
