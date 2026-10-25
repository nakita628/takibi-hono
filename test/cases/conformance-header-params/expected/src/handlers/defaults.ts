import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'headerDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    z.object({
      'x-int-def': z.int().default(20).exactOptional(),
      'x-int64-def': z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.int64())
        .default(5n)
        .exactOptional(),
      'x-bool-def': z.boolean().default(false).exactOptional(),
      'x-str-def': z.string().default('fallback').exactOptional(),
    }),
  ),
  (c) => {},
)
