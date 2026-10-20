import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { IdSchema, FieldsResponse } from '../components'

export const numbersHandler = new Hono().post(
  '/numbers',
  describeRoute({ operationId: 'numbers', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    z.object({
      id: z.int64().exactOptional(),
      unsigned: z.int().exactOptional(),
      ranged: z.int64().min(1n).max(100n).exactOptional(),
      level: z.union([z.literal(1), z.literal(2)]).exactOptional(),
      version: z.literal(5).exactOptional(),
      cursor: z.int64().default(0n).exactOptional(),
      maybe: z.int64().nullable().exactOptional(),
      ids: z.array(z.int64()).exactOptional(),
      small: z.int32().exactOptional(),
      ref: IdSchema.exactOptional(),
    }),
  ),
  (c) => {},
)
