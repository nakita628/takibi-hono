import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as z from 'zod'
import { FieldsResponse } from '../components'

export const multipartHandler = new Hono().post(
  '/multipart',
  describeRoute({ operationId: 'multipart', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    z.object({
      file: z.file(),
      age: z.int().exactOptional(),
      active: z.boolean().exactOptional(),
      ids: z.array(z.int()).exactOptional(),
    }),
  ),
  (c) => {},
)
