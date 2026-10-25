import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const isoHandler = new Hono().get(
  '/iso',
  describeRoute({ operationId: 'queryIso', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      datetime_z: z.iso.datetime().exactOptional(),
      datetime_p3: z.iso.datetime({ precision: 3, offset: true }).exactOptional(),
      datetime_local: z.iso.datetime({ offset: true, local: true }).exactOptional(),
      time_any: z
        .string()
        .regex(
          /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/,
        )
        .exactOptional(),
      time_z: z.iso.time().exactOptional(),
      time_p0: z
        .string()
        .regex(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/)
        .exactOptional(),
      time_p3: z
        .string()
        .regex(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/)
        .exactOptional(),
      time_minute: z
        .string()
        .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?$/)
        .exactOptional(),
    }),
  ),
  (c) => {},
)
