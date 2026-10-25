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
      int_def: z.int().default(20).exactOptional(),
      int64_def: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.int64())
        .default(5n)
        .exactOptional(),
      bool_def: z.boolean().default(false).exactOptional(),
      str_def: z.string().default('fallback').exactOptional(),
    }),
  ),
  (c) => {},
)
