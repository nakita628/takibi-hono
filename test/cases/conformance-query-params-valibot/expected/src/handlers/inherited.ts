import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import * as v from 'valibot'
import { FieldsResponse } from '../components'

export const inheritedHandler = new Hono().get(
  '/inherited',
  describeRoute({ operationId: 'queryInherited', responses: { '200': FieldsResponse } }),
  validator(
    'query',
    v.pipe(
      v.unknown(),
      v.transform((input) =>
        typeof input === 'object' && input !== null && !Array.isArray(input)
          ? Object.assign(Object.create(null), input)
          : input,
      ),
      v.object({
        toString: v.string(),
        valueOf: v.optional(
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
          '3',
        ),
        hasOwnProperty: v.optional(
          v.pipe(
            v.string(),
            v.regex(/^(?:true|1|yes|on|y|enabled|false|0|no|off|n|disabled)$/i),
            v.transform((input) => /^(?:true|1|yes|on|y|enabled)$/i.test(input)),
          ),
        ),
        isPrototypeOf: v.optional(
          v.pipe(
            v.unknown(),
            v.transform((input) => (input === undefined || Array.isArray(input) ? input : [input])),
            v.array(v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger())),
          ),
        ),
        toLocaleString: v.optional(
          v.pipe(v.string(), v.transform(Number), v.number(), v.safeInteger()),
        ),
      }),
    ),
  ),
  (c) => {},
)
