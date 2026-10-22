import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const defaultsHandler = new Hono().get(
  '/defaults',
  describeRoute({ operationId: 'queryDefaults', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      int_def: z.coerce.number().int().default(20).exactOptional(),
      int64_def: z.coerce.bigint().pipe(z.int64()).default(5n).exactOptional(),
      num_def: z.coerce.number().default(0.5).exactOptional(),
      bool_def: z.stringbool().default(false).exactOptional(),
      bool_def_true: z.stringbool().default(true).exactOptional(),
      str_def: z.string().default('fallback').exactOptional(),
      enum_def: z.enum(['asc', 'desc']).default('asc').exactOptional(),
      arr_def: z.array(z.string()).default([]).exactOptional(),
      arr_int_def: z.array(z.coerce.number().int()).default([1, 2]).exactOptional(),
    }),
  ),
  (c) => {},
)
