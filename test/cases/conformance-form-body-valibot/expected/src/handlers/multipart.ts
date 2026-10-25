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
      age: v.optional(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
      active: v.optional(
        v.pipe(
          v.string(),
          v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
          v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
        ),
      ),
      ids: v.optional(
        v.pipe(
          v.unknown(),
          v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
          v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
        ),
      ),
    }),
  ),
  (c) => {},
)
