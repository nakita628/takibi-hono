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
      'x-int-def': z.coerce.number().int().default(20).exactOptional(),
      'x-int64-def': z.coerce.bigint().pipe(z.int64()).default(5n).exactOptional(),
      'x-bool-def': z.stringbool().default(false).exactOptional(),
      'x-str-def': z.string().default('fallback').exactOptional(),
    }),
  ),
  (c) => {},
)
