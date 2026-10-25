import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const openHandler = new Hono().get(
  '/open',
  describeRoute({ operationId: 'cookieOpen', responses: { '200': FieldsResponse } }),
  validator(
    'cookie',
    z.object({
      page: z.coerce.number().int().exactOptional(),
      bag: z.record(z.string(), z.coerce.number().int()).exactOptional(),
    }),
  ),
  (c) => {},
)
