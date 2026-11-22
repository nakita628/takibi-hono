import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const namedHandler = new Hono().get(
  '/named/:user-id/:post_id',
  describeRoute({ operationId: 'namedParam', responses: { '200': FieldsResponse } }),
  validator(
    'param',
    z.object({
      'user-id': z
        .string()
        .regex(/^-?(?:0|[1-9]\d*)$/)
        .transform((val) => Number(val))
        .pipe(z.number().int()),
      post_id: z.stringbool(),
    }),
  ),
  (c) => {},
)
