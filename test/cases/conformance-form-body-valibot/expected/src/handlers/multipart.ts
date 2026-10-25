import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const multipartHandler = new Hono().post(
  '/multipart',
  describeRoute({ operationId: 'multipart', responses: { '200': FieldsResponse } }),
  validator(
    'form',
    v.object({
      file: v.file(),
      age: v.optional(v.pipe(v.number(), v.integer())),
      active: v.optional(v.boolean()),
      ids: v.optional(v.array(v.pipe(v.number(), v.integer()))),
    }),
  ),
  (c) => {},
)
