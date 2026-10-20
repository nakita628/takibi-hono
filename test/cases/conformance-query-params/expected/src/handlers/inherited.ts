import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const inheritedHandler = new Hono().get(
  '/inherited',
  describeRoute({ operationId: 'queryInherited', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    z.object({
      toString: z.string(),
      valueOf: z.coerce.number().int().default(3).exactOptional(),
      hasOwnProperty: z.stringbool().exactOptional(),
      isPrototypeOf: z.array(z.coerce.number().int()).exactOptional(),
      toLocaleString: z.coerce.number().int().exactOptional(),
    }),
  ),
  (c) => {},
)
