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
      big: z
        .union([z.bigint(), z.number().int(), z.string().regex(/^-?\d+$/)])
        .transform((val) => BigInt(val))
        .pipe(z.int64())
        .exactOptional(),
      active: z.boolean().exactOptional(),
      level: z.union([z.literal(1), z.literal(2)]).exactOptional(),
      agreed: z.literal(true).exactOptional(),
      limit: z.int().default(20).exactOptional(),
      count: CountSchema.exactOptional(),
      flag: FlagSchema.exactOptional(),
      tags: z.array(z.string()).exactOptional(),
      ids: z.array(z.int()).exactOptional(),
      moment: z.iso.datetime({ offset: true }).exactOptional(),
      clock: z
        .string()
        .regex(
          /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
        )
        .exactOptional(),
      maybe: z.int().nullable().exactOptional(),
      label: z.string().nullable().exactOptional(),
      constructor: z.int().exactOptional(),
    }),
  ),
  (c) => {},
)
