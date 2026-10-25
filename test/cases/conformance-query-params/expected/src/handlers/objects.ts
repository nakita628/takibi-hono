import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { RangeSchema, FieldsResponse } from '../components'

export const objectsHandler = new Hono().get(
  '/objects',
  describeRoute({ operationId: 'queryObjects', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      deep: z
        .object({
          name: z.string().exactOptional(),
          age: z.coerce.number().int().min(0).exactOptional(),
          active: z.stringbool().exactOptional(),
          ids: z
            .preprocess(
              (val) => (val === undefined || Array.isArray(val) ? val : [val]),
              z.array(z.coerce.number().int()),
            )
            .exactOptional(),
          points: z
            .preprocess(
              (val) => (val === undefined || Array.isArray(val) ? val : [val]),
              z.array(
                z.object({
                  x: z.coerce.number().int().exactOptional(),
                  y: z.coerce.number().int().exactOptional(),
                }),
              ),
            )
            .exactOptional(),
          tags: z
            .preprocess(
              (val) => (val === undefined || Array.isArray(val) ? val : [val]),
              z.array(z.string()),
            )
            .exactOptional(),
          range: z
            .object({
              min: z.coerce.number().int().exactOptional(),
              max: z.coerce.number().int().exactOptional(),
            })
            .exactOptional(),
        })
        .exactOptional(),
      deep_ref: RangeSchema.exactOptional(),
      spread: z
        .object({
          sort: z.enum(['asc', 'desc']).exactOptional(),
          size: z.coerce.number().int().exactOptional(),
          page: z.coerce.number().int().exactOptional(),
        })
        .exactOptional(),
      pairs: z
        .object({ name: z.string().exactOptional(), age: z.coerce.number().int().exactOptional() })
        .exactOptional(),
      page: z.string().exactOptional(),
      limit: z.coerce.number().int().exactOptional(),
    }),
  ),
  (c) => {},
)
