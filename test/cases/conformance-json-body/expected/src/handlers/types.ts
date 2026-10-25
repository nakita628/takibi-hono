import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const typesHandler = new Hono().post(
  '/types',
  describeRoute({ operationId: 'types', responses: { '200': FieldsResponse } }),
  validator(
    'json',
    z.object({
      either: z.union([z.int(), z.string()]).exactOptional(),
      flagged: z.union([z.number(), z.boolean()]).nullable().exactOptional(),
      bounded: z.union([z.int().min(1), z.string().min(2)]).exactOptional(),
      moment: z.iso.datetime({ offset: true }).exactOptional(),
      clock: z
        .string()
        .regex(
          /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
        )
        .exactOptional(),
      inherited: z
        .object({ constructor: z.int().exactOptional(), name: z.string().exactOptional() })
        .exactOptional(),
      labelled: z.record(z.string(), z.int()).exactOptional(),
    }),
  ),
  (c) => {},
)
