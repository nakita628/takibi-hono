import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { CountSchema, FlagSchema, FieldsResponse } from '../components'

export const urlencodedHandler = new Hono().post(
  '/urlencoded',
  describeRoute({ operationId: 'urlencoded', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    z.object({
      name: z.string().exactOptional(),
      age: z.int().min(0).exactOptional(),
      ratio: z.number().exactOptional(),
      big: z.int64().exactOptional(),
      active: z.boolean().exactOptional(),
      level: z.union([z.literal(1), z.literal(2)]).exactOptional(),
      agreed: z.literal(true).exactOptional(),
      limit: z.int().default(20).exactOptional(),
      count: CountSchema.exactOptional(),
      flag: FlagSchema.exactOptional(),
      tags: z.array(z.string()).exactOptional(),
      ids: z.array(z.int()).exactOptional(),
      moment: z.iso.datetime().exactOptional(),
      clock: z.iso.time().exactOptional(),
      maybe: z.int().nullable().exactOptional(),
      label: z.string().nullable().exactOptional(),
      constructor: z.int().exactOptional(),
    }),
  ),
  (c) => {},
)
