import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const stylesHandler = new Hono().get(
  '/styles',
  describeRoute({ operationId: 'queryStyles', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      csv: z.array(z.coerce.number().int()).exactOptional(),
      pipes: z.array(z.coerce.number().int()).exactOptional(),
      spaces: z.array(z.coerce.number().int()).exactOptional(),
      filter: z
        .object({ name: z.string().exactOptional(), age: z.coerce.number().int().exactOptional() })
        .exactOptional(),
      csv_str: z.array(z.string()).exactOptional(),
    }),
  ),
  (c) => {},
)
