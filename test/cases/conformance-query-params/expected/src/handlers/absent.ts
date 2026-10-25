import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { CountSchema, FieldsResponse } from '../components'

export const absentHandler = new Hono().get(
  '/absent',
  describeRoute({ operationId: 'queryAbsent', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      empty_ok: z.coerce.number().int().exactOptional(),
      empty_def: z.coerce.number().int().default(7).exactOptional(),
      empty_str: z.string().exactOptional(),
      ref_def: CountSchema.default(3).exactOptional(),
    }),
  ),
  (c) => {},
)
