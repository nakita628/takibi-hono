import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const componentHandler = new Hono().post(
  '/component',
  describeRoute({ operationId: 'component', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    z.object({
      name: z.string(),
      price: z.coerce.number().int().min(0),
      stocked: z.stringbool().exactOptional(),
    }),
  ),
  (c) => {},
)
