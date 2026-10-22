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
      either: z.string().exactOptional(),
      flagged: z.number().nullable().exactOptional(),
      bounded: z.string().min(2).exactOptional(),
      moment: z.iso.datetime().exactOptional(),
      clock: z.iso.time().exactOptional(),
      inherited: z
        .object({ constructor: z.int().exactOptional(), name: z.string().exactOptional() })
        .exactOptional(),
      labelled: z.record(z.string(), z.int()).exactOptional(),
    }),
  ),
  (c) => {},
)
