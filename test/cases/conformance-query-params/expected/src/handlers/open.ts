import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const openHandler = new Hono().get(
  '/open',
  describeRoute({ operationId: 'queryOpen', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      page: z
        .preprocess(
          (val) => (typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val),
          z.number().int(),
        )
        .exactOptional(),
      extra: z
        .looseObject({ known: z.string().exactOptional() })
        .refine((val) =>
          Object.entries(val).every(
            ([key, value]) =>
              ['known'].includes(key) ||
              z
                .preprocess(
                  (val) =>
                    typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
                  z.number().int(),
                )
                .safeParse(value).success,
          ),
        )
        .exactOptional(),
    }),
  ),
  (c) => {},
)
