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
      age: z
        .string()
        .regex(/^-?(?:0|[1-9]\d*)$/)
        .transform((val) => Number(val))
        .pipe(z.number().int())
        .exactOptional(),
      active: z.stringbool().exactOptional(),
      ids: z
        .preprocess(
          (val) => (val === undefined || Array.isArray(val) ? val : [val]),
          z.array(
            z
              .string()
              .regex(/^-?(?:0|[1-9]\d*)$/)
              .transform((val) => Number(val))
              .pipe(z.number().int()),
          ),
        )
        .exactOptional(),
    }),
  ),
  (c) => {},
)
