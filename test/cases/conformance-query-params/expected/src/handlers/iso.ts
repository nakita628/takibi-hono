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
      datetime_z: z.iso.datetime({ offset: false }).exactOptional(),
      datetime_p3: z.iso.datetime({ precision: 3 }).exactOptional(),
      datetime_local: z.iso.datetime({ local: true }).exactOptional(),
      time_any: z.iso.time().exactOptional(),
      time_z: z.iso.time().exactOptional(),
      time_p0: z.iso.time().exactOptional(),
      time_p3: z.iso.time().exactOptional(),
      time_minute: z.iso.time().exactOptional(),
    }),
  ),
  (c) => {},
)
