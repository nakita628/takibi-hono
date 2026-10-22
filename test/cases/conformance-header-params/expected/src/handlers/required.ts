import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const requiredHandler = new Hono().get(
  '/required',
  describeRoute({ operationId: 'headerRequired', responses: { '200': FieldsResponse } }),
  validator(
    'header',
    z.object({
      'x-id': z.int(),
      'x-big': z.int64(),
      'x-flag': z.boolean(),
      'x-name': z.string(),
      'x-note': z.int().exactOptional(),
    }),
  ),
  (c) => {},
)
