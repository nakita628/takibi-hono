import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const absentHandler = new Hono().get(
  '/absent',
  describeRoute({ operationId: 'queryAbsent', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      empty_ok: z
        .preprocess(
          (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
          z.number().int(),
        )
        .exactOptional(),
      empty_def: z
        .preprocess(
          (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
          z.number().int(),
        )
        .default(7)
        .exactOptional(),
      empty_str: z.string().exactOptional(),
      ref_def: z
        .preprocess(
          (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
          z.number().int().min(0),
        )
        .default(3)
        .exactOptional(),
    }),
  ),
  (c) => {},
)
