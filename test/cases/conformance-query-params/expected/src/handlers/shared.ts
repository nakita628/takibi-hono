import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const sharedHandler = new Hono().get(
  '/shared',
  describeRoute({ operationId: 'queryShared', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      filter: z
        .object({
          name: z.string().exactOptional(),
          age: z
            .preprocess(
              (val) =>
                typeof val === 'string' && /^-?(?:0|[1-9]\d*)$/.test(val) ? Number(val) : val,
              z.number().int(),
            )
            .exactOptional(),
        })
        .exactOptional(),
      sort: z
        .object({ name: z.string().exactOptional(), dir: z.enum(['asc', 'desc']).exactOptional() })
        .exactOptional(),
    }),
  ),
  (c) => {},
)
